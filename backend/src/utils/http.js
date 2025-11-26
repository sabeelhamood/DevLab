let fetchInstance = globalThis.fetch

export const getFetch = async () => {
  if (!fetchInstance) {
    const { default: nodeFetch } = await import('node-fetch')
    fetchInstance = nodeFetch
  }
  return fetchInstance
}

















