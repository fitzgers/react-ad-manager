var React = require('react');

const adsToRefresh = [];
const adFactory = (adSlot, googletag, refreshTimer) => {
    const internalRefreshTimer = refreshTimer;
    const internalGoogletag = googletag;
    let instance = null;
    let viewPercentage = 0;
    let isLoopRun = false;
    let isRefreshable = false;
    let isImpressionViewable = false;
    const setViewPercentage = (vp) => {
        viewPercentage = vp;
    };
    const impressionViewable = () => {
        isImpressionViewable = true;
    };
    const loop = () => {
        if (isImpressionViewable && viewPercentage > 50) {
            isLoopRun = true;
            if (isRefreshable) {
                internalGoogletag.pubads().refresh([adSlot]);
                isRefreshable = false;
                isImpressionViewable = false;
            }
            setTimeout(() => {
                if (isImpressionViewable && viewPercentage > 50) {
                    internalGoogletag.pubads().refresh([adSlot]);
                }
                else {
                    isRefreshable = true;
                }
                isLoopRun = false;
            }, internalRefreshTimer);
        }
    };
    return {
        runLoop: () => {
            if (instance === null || !isLoopRun)
                instance = new loop();
            return instance;
        },
        setViewPercentage,
        impressionViewable,
        adSlot,
    };
};
const pushAdSlotToRefresh = (adSlot, googletag, refreshTimer) => {
    if (!googletag || !refreshTimer || isNaN(refreshTimer)) {
        console.error('Invalid parameters for pushAdSlotToRefresh');
        return;
    }
    const adSlotToInsert = adFactory(adSlot, googletag, refreshTimer);
    adsToRefresh.push(adSlotToInsert);
};
const refreshViewPercentage = (event) => {
    const { slot, inViewPercentage } = event;
    const adIndex = adsToRefresh.findIndex((el) => el.adSlot.getSlotElementId() === slot.getSlotElementId());
    if (adIndex === -1)
        return;
    adsToRefresh[adIndex].setViewPercentage(inViewPercentage);
    adsToRefresh[adIndex].runLoop();
};
const impressionViewable = (event) => {
    const { slot } = event;
    const adIndex = adsToRefresh.findIndex((el) => el.adSlot.getSlotElementId() === slot.getSlotElementId());
    if (adIndex === -1)
        return;
    adsToRefresh[adIndex].impressionViewable();
    adsToRefresh[adIndex].runLoop();
};

let internalNetworkCode = "";
const networkCode = {
    get: () => internalNetworkCode,
    set: (nc) => internalNetworkCode = nc
};

// eslint-disable-next-line react/prop-types
const Ad = ({ adUnit, name, target = [], type, size, refreshTimer = 0, eventImpressionViewable, eventSlotOnload, eventSlotRenderEnded, eventSlotRequested, eventSlotResponseReceived, eventSlotVisibilityChanged, }) => {
    let googletag;
    let adSlot = null;
    const displayCommonAd = () => {
        googletag.cmd.push(() => {
            adSlot = googletag
                .defineSlot(`${networkCode.get()}${adUnit}`, generateSize(), name)
                .addService(googletag.pubads());
            mappingSize();
            setEvents(adSlot);
            setTargeting();
            googletag.enableServices();
            googletag.display(name);
        });
    };
    const displayEspecialAd = () => {
        googletag.cmd.push(() => {
            adSlot = googletag.defineOutOfPageSlot(`${networkCode.get()}${adUnit}`, googletag.enums.OutOfPageFormat[type]);
            if (adSlot) {
                setTargeting();
                setEvents(adSlot);
                mappingSize();
                adSlot.addService(googletag.pubads());
                googletag.pubads().enableSingleRequest();
                googletag.enableServices();
            }
        });
    };
    const setEvents = (targetSlot) => {
        googletag.pubads().addEventListener('slotOnload', (event) => {
            if (event.slot === targetSlot) {
                if (eventSlotOnload)
                    eventSlotOnload(event);
                if (refreshTimer)
                    pushAdSlotToRefresh(event.slot, googletag, Number(refreshTimer));
            }
        });
        googletag
            .pubads()
            .addEventListener('slotVisibilityChanged', (event) => {
            if (event.slot === targetSlot) {
                if (eventSlotVisibilityChanged)
                    eventSlotVisibilityChanged(event);
                if (refreshTimer)
                    refreshViewPercentage(event);
            }
        });
        googletag.pubads().addEventListener('impressionViewable', (event) => {
            if (event.slot === targetSlot) {
                if (eventImpressionViewable)
                    eventImpressionViewable(event);
                if (refreshTimer)
                    impressionViewable(event);
            }
        });
        if (eventSlotRenderEnded)
            googletag.pubads().addEventListener('slotRenderEnded', (event) => {
                if (event.slot === targetSlot) {
                    if (eventSlotRenderEnded)
                        eventSlotRenderEnded(event);
                    if (refreshTimer)
                        impressionViewable(event);
                }
            });
        if (eventSlotRequested)
            googletag
                .pubads()
                .addEventListener('eventSlotRequested', (event) => {
                if (event.slot === targetSlot) {
                    if (eventSlotRequested)
                        eventSlotRequested(event);
                    if (refreshTimer)
                        impressionViewable(event);
                }
            });
        if (eventSlotResponseReceived)
            googletag
                .pubads()
                .addEventListener('eventSlotResponseReceived', (event) => {
                if (event.slot === targetSlot) {
                    if (eventSlotResponseReceived)
                        eventSlotResponseReceived(event);
                    if (refreshTimer)
                        impressionViewable(event);
                }
            });
    };
    const setTargeting = () => {
        target.forEach((el) => adSlot.setTargeting(el[0], el[1]));
    };
    const generateSize = () => {
        const internalSize = size;
        if (!(typeof internalSize === 'object' &&
            typeof internalSize[0][1] === 'object'))
            return size;
        return internalSize.map((el) => [el[0], el[1]]);
    };
    const mappingSize = () => {
        const internalSize = size;
        if (!(typeof internalSize === 'object' &&
            typeof internalSize[0][1] === 'object'))
            return;
        let mapping = googletag.sizeMapping();
        internalSize.forEach((el) => (mapping = mapping.addSize(el[0], el[1])));
        mapping = mapping.build();
        adSlot.defineSizeMapping(mapping);
    };
    React.useEffect(() => {
        window.googletag = window.googletag || { cmd: [] };
        googletag = window.googletag;
        googletag.cmd.push(() => {
            // eslint-disable-next-line react/prop-types
            type ? displayEspecialAd() : displayCommonAd();
        });
    }, []);
    React.useEffect(() => {
        return () => {
            if (adSlot) {
                googletag.destroySlots([adSlot]);
            }
        };
    }, []);
    if (type)
        return null;
    return React.createElement("div", { id: name });
};

const AdConfig = ({ networkCode: networkCode$1, target = [], enableLazyLoad, enableSingleRequest, collapseEmptyDivs, eventImpressionViewable, eventSlotOnload, eventSlotRenderEnded, eventSlotRequested, eventSlotResponseReceived, eventSlotVisibilityChanged, }) => {
    let googletag;
    const setConfigs = () => {
        if (networkCode$1)
            networkCode.set(networkCode$1);
        if (enableLazyLoad)
            googletag.pubads().enableLazyLoad(enableLazyLoad);
        if (collapseEmptyDivs)
            googletag.pubads().collapseEmptyDivs(true);
        if (enableSingleRequest)
            googletag.pubads().enableSingleRequest();
    };
    const setTargeting = () => {
        target.forEach((el) => googletag.pubads().setTargeting(el[0], el[1]));
    };
    const setEvents = () => {
        googletag.pubads().addEventListener('slotOnload', (event) => {
            if (eventSlotOnload)
                eventSlotOnload(event);
        });
        googletag
            .pubads()
            .addEventListener('slotVisibilityChanged', (event) => {
            if (eventSlotVisibilityChanged)
                eventSlotVisibilityChanged(event);
        });
        googletag.pubads().addEventListener('impressionViewable', (event) => {
            if (eventImpressionViewable)
                eventImpressionViewable(event);
        });
        if (eventSlotRenderEnded)
            googletag
                .pubads()
                .addEventListener('slotRenderEnded', eventSlotRenderEnded);
        if (eventSlotRequested)
            googletag.pubads().addEventListener('slotRequested', eventSlotRequested);
        if (eventSlotResponseReceived)
            googletag
                .pubads()
                .addEventListener('slotResponseReceived', eventSlotResponseReceived);
    };
    React.useEffect(() => {
        window.googletag = window.googletag || { cmd: [] };
        googletag = window.googletag;
        googletag.cmd.push(() => {
            setConfigs();
            setEvents();
            setTargeting();
            googletag.enableServices();
        });
    }, []);
    return null;
};

const AdScript = () => {
    return (React.createElement("script", { async: true, src: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js' }));
};

exports.Ad = Ad;
exports.AdConfig = AdConfig;
exports.AdScript = AdScript;
//# sourceMappingURL=index.js.map
