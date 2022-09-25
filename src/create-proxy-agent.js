const createHttpsProxyAgent = require('https-proxy-agent')

export const createProxyAgent = () => {
  const { https_proxy, HTTPS_PROXY } = process.env
  const proxy = https_proxy || HTTPS_PROXY

  if (!proxy) {
    throw new Error(`Couldn't create proxy agent: No proxy configuration found`)
  }

  return createHttpsProxyAgent(proxy)
}
