(function(global, factory) {
    if (typeof exports === "object" && typeof module != "undefined") {
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) {
        define(factory);
    } else {
        global.MetaxAds = factory();
    }
})(this, (function() {
    "use strict";
    //-- 广告容器对象
    var adContainer;
    //-- 视频容器
    var videoElement;
    //-- 呈现广告的容器对象
    var adDisplayContainer;
    //-- 请求广告并处理来自广告请求响应的事件的对象
    var adsLoader;
    //-- 广告请求的响应、控制广告播放并侦听由 SDK 触发的广告事件的对象
    var adsManager;
    //-- 广告请求参数
    var adsRequest;
    //-- 是否自动播放广告
    var adIsAutoPlay = false;
    //-- 公共函数
    var Fun = {};

    Fun.slog = function(text, content) {
        if (MetaxAds.options && MetaxAds.options.debug == true) {
            (text && content) ? console.log(text, content): console.log(text);
        }
    }

    Fun.GetRequest = function() {
        var url = location.search;
        var theRequest = new Object();
        if (url.indexOf("?") != -1) {
            var str = url.substr(1);
            var strs = str.split("&");
            for (var i = 0; i < strs.length; i++) {
                theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
            }
        }
        return theRequest;
    }

    Fun.getSizeWindow = function() {
        var e = document.documentElement,
            b = document.getElementsByTagName('body')[0];
        var width = window.innerWidth || e.clientWidth || b.clientWidth;
        var height = window.innerHeight || e.clientHeight || b.clientHeight;
        return { width: width, height: height };
    }

    var MetaxAds = {
        init: function(adUnit, options) {
            this.adUnit = adUnit;
            this.options = options;
            this.initContainer();
            this.initializeIMA();
            this.adsRequest();
        },
        initContainer: function() {
            //-- 判断是否存在广告容器
            if (!document.getElementById("ad_container")) {
                Fun.slog('initAdContainerElement');
                var _dom = document.createElement('div');
                _dom.setAttribute("id", "ad_container");
                _dom.setAttribute("style", "display:none;position:absolute;z-index:999;");
                var _videoElem = document.createElement("video");
                _videoElem.setAttribute("id", "video_element");
                _dom.appendChild(_videoElem);
                document.body.insertBefore(_dom, document.body.firstChild);
            }
            adContainer = document.getElementById("ad_container");
        },
        //-- 初始化IMA，定义广告的容器ID
        initializeIMA: function() {
            if (adsLoader) {
                Fun.slog('adsLoader is exists');
                adsLoader.contentComplete();
                return true;
            }
            Fun.slog("initAdsLoader");
            videoElement = document.getElementById('video_element');
            //-- 呈现广告的容器对象
            adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, videoElement);
            //-- 请求广告并处理来自广告请求响应的事件的对象
            adsLoader = new google.ima.AdsLoader(adDisplayContainer);
            Fun.slog('adsLoaderInited', adsLoader);
            //-- 监听adManager对象初始化成功
            adsLoader.addEventListener(
                google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
                MetaxAds.onAdsManagerLoaded,
                false);
            //-- 监听广告请求失败事件
            adsLoader.addEventListener(
                google.ima.AdErrorEvent.Type.AD_ERROR,
                MetaxAds.onAdError,
                false);
        },
        adsRequest: function() {
            //-- 实例化广告请求的对象
            adsRequest = new google.ima.AdsRequest();
			var adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/nonlinear_ad_samples&sz=480x70&cust_params=sample_ct%3Dnonlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=';
			//adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/vmap_ad_samples&sz=640x480&cust_params=sample_ar%3Dpreonly&ciu_szs=300x250%2C728x90&gdfp_req=1&ad_rule=1&output=vmap&unviewed_position_start=1&env=vp&impl=s&correlator=';
			//adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=';
			var params = Fun.GetRequest();
            var cp = params.cp;
            var pn = params.pn;
            //-- 必须拼接该参数用于数据区分
            if (pn && cp) {
                adTagUrl += '&cust_params=pn%3D' + pn + '%26cp%3D' + cp
            }
            //-- 测试过程中请打开该开关
            if (this.options.adsTest) {
                adTagUrl += '&adtest=on'
            }
            //-- 广告VastTag
            Fun.slog("adsVastTag:", adTagUrl);
            //-- 添加请求tagUrl
            adsRequest.adTagUrl = adTagUrl;
            //-- 强制使用全屏来展示非线性广告
            adsRequest.forceNonLinearFullSlot = true;
            //-- 设置请求广告尺寸
            var obj = Fun.getSizeWindow();
            adsRequest.linearAdSlotWidth = obj.width;
            adsRequest.linearAdSlotHeight = obj.height;
            adsRequest.nonLinearAdSlotWidth = obj.width;
            adsRequest.nonLinearAdSlotHeight = obj.height;
            //-- 请求广告
            Fun.slog("adsRequestStart");
            adsLoader.requestAds(adsRequest);
        },
        onAdsManagerLoaded: function(adsManagerLoadedEvent) {
            //-- 修改ads加载的配置
            var adsRenderingSettings = new google.ima.AdsRenderingSettings();
            //-- 开启预请求
            adsRenderingSettings.enablePreloading = true;
            adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;

            //-- 从adsLoader的响应中, 实例化 AdsManager 并将视频元素传递给它
            adsManager = adsManagerLoadedEvent.getAdsManager(
                videoElement, adsRenderingSettings);

            Fun.slog('AdsManagerInited', google.ima.AdEvent.Type);

            //-- 监听来自adsManager的错误
            adsManager.addEventListener(
                google.ima.AdErrorEvent.Type.AD_ERROR,
                MetaxAds.onAdError);
            //-- 广告开始播放
            adsManager.addEventListener(
                google.ima.AdEvent.Type.STARTED,
                MetaxAds.onAdStart);
            //-- 监听广告点击
            adsManager.addEventListener(
                google.ima.AdEvent.Type.CLICK,
                MetaxAds.onAdSuccess);
            //-- 监听广告跳过
            adsManager.addEventListener(
                google.ima.AdEvent.Type.SKIPPED,
                MetaxAds.onAdSuccess);
            //-- 视频正常播放结束
            adsManager.addEventListener(
                google.ima.AdEvent.Type.COMPLETE,
                MetaxAds.onAdSuccess);
            //-- 监听完成了所有广告（有可能是error导致的广告播放结束）
            adsManager.addEventListener("allAdsCompleted",
                function(e){console.log(e)});
            adsManager.addEventListener(
                google.ima.AdEvent.Type.SKIPPABLE_STATE_CHANGED,
                function() {
                    document.addEventListener("keyup", MetaxAds.onSkipEvent, true)
                });

            //-- 判断广告是否自动播放
            if (adIsAutoPlay == true) {
                MetaxAds.adManagerLoad()
                adIsAutoPlay = false;
            }
        },
        adManagerLoad: function() {
            //-- 初始化adsManager播放广告
            adDisplayContainer.initialize();
            var obj = Fun.getSizeWindow();
            adsManager.init(obj.width, obj.height, google.ima.ViewMode.FULLSCREEN);
            adsManager.start();
            Fun.slog('AdsManagerStart');
        },
        destroy: function() {
            Fun.slog('ads destroy');
            adsManager && adsManager.destroy();
            adsManager = undefined;
        },
        focus: function() {
            adsManager && adsManager.focus();
        },
        hiddenAds: function() {
            adContainer.style.display = 'none';
            //-- 移除广告跳过监听
            this.removeSkipEvent();
            //-- 设置焦点到body上
            window.focus();
        },
        showAds: function() {
            Fun.slog("show ads container");
            adContainer.style.display = 'block';
        },
        onSkipEvent: function(event) {
            if (event.key === "Enter" || event.keyCode === 13) {
                adsManager.skip();
            }
        },
        removeSkipEvent: function() {
            document.removeEventListener("keyup", MetaxAds.onSkipEvent, true);
        },
        //-- 广告结束（无法判断成功与否）
        onAdEnd: function() {
            Fun.slog('adEnd');
            MetaxAds.hiddenAds();
            MetaxAds.destroy();
			MetaxAds.options && MetaxAds.options.adsEnd && MetaxAds.options.adsEnd();
        },
        //-- 广告请求失败
        onAdError: function(adErrorEvent) {
            Fun.slog('adError:', adErrorEvent.getError());
            MetaxAds.hiddenAds();
            MetaxAds.destroy();
            MetaxAds.options && MetaxAds.options.adsError && MetaxAds.options.adsError();
        },
        onAdStart: function() {
            console.log('ad start')
            MetaxAds.showAds();
            MetaxAds.options && MetaxAds.options.adsStart && MetaxAds.options.adsStart();
        },
        onAdSuccess: function() {
            Fun.slog('adSuccess');
            MetaxAds.hiddenAds();
            //MetaxAds.destroy();
            MetaxAds.adsRequest();
            MetaxAds.options && MetaxAds.options.adsSuccess && MetaxAds.options.adsSuccess();
        },
        loadAds: function() {
            //-- 开始加载广告
            Fun.slog("startLoadAds");
            if (typeof(adsManager) != "undefined") {
                this.adManagerLoad();
            } else {
                adIsAutoPlay = true;
                this.adsRequest();
            }
        }
    }
    return MetaxAds
}));