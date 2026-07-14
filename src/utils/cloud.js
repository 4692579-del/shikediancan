import cloudConfig from './cloud-config.js'

let cloudClient = null

function normalizeError(error) {
  if (!error) return 'unknown error'
  const simple = {
    message: error.message,
    errMsg: error.errMsg,
    code: error.code,
    errCode: error.errCode,
    name: error.name,
    stack: error.stack
  }
  try {
    return JSON.stringify(simple)
  } catch (e) {
    return String(error)
  }
}

function getClient() {
  if (cloudClient) return cloudClient
  if (typeof uniCloud === 'undefined') {
    throw new Error('uniCloud is not available in current runtime')
  }
  cloudClient = typeof uniCloud.init === 'function' ? uniCloud.init(cloudConfig) : uniCloud
  return cloudClient
}

function callFunction(options) {
  const client = getClient()
  return client.callFunction(options)
}

function uploadFile(options) {
  const client = getClient()
  if (typeof client.uploadFile !== 'function') {
    throw new Error('uniCloud uploadFile is not available in current runtime')
  }
  return client.uploadFile(options)
}

export default { getClient, callFunction, uploadFile, normalizeError }
