# eCFR_Analyzer_backend

A node service to handle fetching ECFR data and then analyzing it, looking for metrics of various kinds.

# RUN ME FIRST

In order to run this server with the data it needs, we need to pull down what we want.

So, run this command:
`node utils/fetch-data.js`

The routines in this script are straight forward and self-explanataory. The key thing to realize is that the services on the ecfr.gov website will throttle our requests. I'm not sure yet if this is because it only allows `n` number of requests and then it throttles, or if its after `x` _size_ of request (like, after you download 50mb) it starts to throttle.

Either way, we know we've been throttled when we get queued up requests, so we can safely retry. This will allow us to pick up where we left off.

# sample outputs

sample outputs are in the `data` folder
