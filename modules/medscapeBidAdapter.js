import {registerBidder} from '../src/adapters/bidderFactory.js';
import { config } from '../src/config.js';
import { logInfo, logWarn } from '../src/utils.js';

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

    logInfo(`Fetching scriptUrl ${scriptUrl}`);

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
    const bidResponses = [];

    if (!serverResponse || !serverResponse.body || !serverResponse.body.winners) {
      logWarn('Medscape: No valid bid responses found.');
      return bidResponses;
    }

    const { winners } = serverResponse.body;
    const { validBidRequests } = request;

    logInfo(`Winners: ${JSON.stringify(winners)}`);
    logInfo(`Valid requests: ${JSON.stringify(validBidRequests)}`);

    winners.forEach((winner) => {
      const matchedBidRequest = validBidRequests.find(
        (bid) => bid.adUnitCode === winner.external_id
      );

      if (matchedBidRequest) {
        bidResponses.push({
          requestId: matchedBidRequest.bidId,
          cpm: winner.price / 100, // Convert cents to dollars if necessary
          width: winner.w,
          height: winner.h,
          creativeId: winner.winner_id, // Used for reporting, not rendering
          dealId: winner.deal_id || null, // Pass the Deal ID
          currency: "USD",
          netRevenue: true,
          ttl: 300, // TTL in seconds (5 minutes)
          ad: "", // No actual ad markup; GAM will serve the creative
          meta: {
            advertiserDomains: [], // Optional: If you have domain data, pass it here
          }
        });
      } else {
        logWarn(`Medscape: No matching bid request for external_id ${winner.external_id}`);
      }
    });
    return bidResponses;
  },
  getUserSyncs: () => {
    // Do we need this?
    return [];
  }
}

registerBidder(spec);
