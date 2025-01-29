import {registerBidder} from '../src/adapters/bidderFactory.js';
import { config } from '../src/config.js';

const BIDDER_CODE = 'medscape';

const spec = {
  code: BIDDER_CODE,
  isBidRequestValid: (bid) => {
    // Actually should check on whether us here...
    const bidderConfig = config.getBidderConfig()['medscape'];
    return bidderConfig.geo.toLowerCase() === 'us'
  },
  buildRequests: (validBidRequests, bidderRequest) => {
    const bidderConfig = config.getBidderConfig()['medscape'];
    const adSlots = validBidRequests.map((request) => {
      return `${bidderConfig.publisherDomain}_${request.adUnitCode}`;
    });
    const scriptSrc = 'https://serving.mdscpxchg.com/ad';
    const externalIds = `external_ids=${adSlots.join(',')}`;
    const npiHashed = `npi_hashed=${bidderConfig.provider.npi_hashed}`;
    const scriptUrl = `${scriptSrc}?${externalIds}&${npiHashed}`;

    // Prebid does the actual fetching, I just supply the method.
    return [
      {
        method: 'GET',
        url: scriptUrl,
        data: {}, // Optional: Include additional data here if needed
        validBidRequests, // Attach this for reference in `interpretResponse`
      },
    ];
  },
  interpretResponse: (serverResponse, request) => {
    // @TODO take serverResponse, called by prebid, and translat to standard prebid ssp response.
    // THIS IS CALLED BY PREBID, not by me
  },
  getUserSyncs: () => {
    // Do we need this?
    return [];
  }
}

registerBidder(spec);
