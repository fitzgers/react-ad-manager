const adsToRefresh: Array<any> = []

const adFactory = (adSlot: any, googletag: any, refreshTimer: number) => {
  const internalRefreshTimer = refreshTimer
  const internalGoogletag = googletag
  let instance: any = null
  let viewPercentage = 0
  let isLoopRun = false
  let isRefreshable = false
  let isImpressionViewable = false

  const setViewPercentage = (vp: number) => {
    viewPercentage = vp
  }
  const impressionViewable = () => {
    isImpressionViewable = true
  }
  const loop: any = () => {
    if (isImpressionViewable && viewPercentage > 50) {
      isLoopRun = true
      if (isRefreshable) {
        internalGoogletag.pubads().refresh([adSlot])
        isRefreshable = false
        isImpressionViewable = false
      }
      setTimeout(() => {
        if (isImpressionViewable && viewPercentage > 50) {
          internalGoogletag.pubads().refresh([adSlot])
        } else {
          isRefreshable = true
        }
        isLoopRun = false
      }, internalRefreshTimer)
    }
  }

  return {
    runLoop: () => {
      if (instance === null || !isLoopRun) instance = new loop()
      return instance
    },
    setViewPercentage,
    impressionViewable,
    adSlot,
  }
}

export const pushAdSlotToRefresh = (
  adSlot: any,
  googletag: any,
  refreshTimer: number
) => {
  if (!googletag || !refreshTimer || isNaN(refreshTimer)) {
    console.error('Invalid parameters for pushAdSlotToRefresh')
    return
  }
  const adSlotToInsert = adFactory(adSlot, googletag, refreshTimer)
  adsToRefresh.push(adSlotToInsert)
}

export const refreshViewPercentage = (event: any) => {
  const { slot, inViewPercentage } = event
  const adIndex = adsToRefresh.findIndex(
    (el) => el.adSlot.getSlotElementId() === slot.getSlotElementId()
  )
  if (adIndex === -1) return
  adsToRefresh[adIndex].setViewPercentage(inViewPercentage)
  adsToRefresh[adIndex].runLoop()
}

export const impressionViewable = (event: any) => {
  const { slot } = event
  const adIndex = adsToRefresh.findIndex(
    (el) => el.adSlot.getSlotElementId() === slot.getSlotElementId()
  )
  if (adIndex === -1) return
  adsToRefresh[adIndex].impressionViewable()
  adsToRefresh[adIndex].runLoop()
}
