import {registerBidder} from '../src/adapters/bidderFactory.js';
import { config } from '../src/config.js';

const BIDDER_CODE = 'medscape';

const spec = {
  code: BIDDER_CODE,
  isBidRequestValid: (bid) => {
    return !!bid.params.placementId;
  },
  buildRequests: (validBidRequests, bidderRequest) => {
    debugger;

    const bidderConfig = config.getBidderConfig()['medscape'];
    console.log(bidderConfig);
    // See what happens here
    // send bid request to medscape

    const adSlots = validBidRequests.map((request) => {
      return request.adUnitCode;
    });

    const scriptSrc = 'https://serving.mdscpxchg.com/ad'

    const externalIds = `external_ids=${adSlots.join(',')}`

    const npiHashed = `npihashed=${bidderConfig.provider.npi_hashed}`;

    const scriptUrl = `${scriptSrc}?${externalIds}&${npiHashed}`

    async function requestMedscapeBids() {
      try {
        const response = await fetch(scriptUrl);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();

        return json;
      } catch (error) {
        console.error(`Error fetching medscape bids: ${error}`);
        return Promise.reject(error)
      }
    }

    requestMedscapeBids().then((data) => {
      debugger;
      // if we get a response go to interpretResponse... unless that is called automatically
    }).catch((error) => {
      console.error(error);
      debugger;
    });
  },
  interpretResponse: (serverResponse, request) => {
    debugger;
    // again see what happens
  },
  getUserSyncs: () => {
    // Do we need this?
    return [];
  }
}

registerBidder(spec);
