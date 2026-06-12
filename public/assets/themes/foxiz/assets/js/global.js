/**  FOXIZ MAN SCRIPT */
var FOXIZ_MAIN_SCRIPTS = (function (Module, $) {
        'use strict';

        Module.initParams = function () {
            Module.body = $('body');
            Module.iOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
            Module.document = $(document);
            Module.html = $('html, body');
            Module.outerHTML = $('html');
            Module.window = $(window);
            Module.ajaxData = {};
            Module.themeSettings = foxizParams;
            Module.wPoint = {};
            Module.sticky = {};
            Module.eSticky = {};
            Module.YTPlayers = {};
            Module.articleData = [];
            Module.iframeAPIFlag = false;
            Module.bookmarkProgressing = false;
            Module.followProgressing = false;
            Module.readIndicator = $('#reading-progress');
            Module.readIndicatorPercent = 0;
            Module.bookmarkData = {}
            Module.siteAccessFlag = false;
        }

        Module.init = function () {
            this.initParams();
            this.syncBookmark();
            this.myBookmarks();
            this.topSpacing();
            this.siteAccessDetector();
            this.headerDropdown();
            this.mobileCollapse();
            this.privacyTrigger();
            this.popupNewsletter();
            this.backTop();
            this.paginationInfinite();
            this.loadYoutubeIframe();
            this.singleInfiniteLoadNext();
            this.readIndicatorInit();
            this.fontResizer();
            this.sliders();
            this.carousels();
            this.breakingNews();
            this.liveSearch();
            this.browserResize();
            this.initSubMenuPos();
            this.documentClick();
            this.footerSlideUp();
            this.documentReload();
            this.initAjaxBlocks();
            this.delayLoad();
            this.cartNotification();
        }

        Module.documentReload = function () {
            this.followToggle();
            this.bookmarkToggle();
            this.loginPopup();
            this.hoverTipsy();
            this.paginationNextPrev();
            this.paginationLoadMore();
            this.showPostComment();
            this.scrollToComment();
            this.replyReview();
            this.usersRating();
            this.singleGallery();
            this.floatingVideo();
            this.videoPreview();
            this.floatingVideoRemove();
            this.scrollTableContent();
            this.singleScrollRefresh();
            this.productQuantity();
            this.playerAutoPlay();
            this.tocToggle();
            this.hoverEffects();
            this.highlightShares();
            this.galleryLightbox();
            this.singleFeaturedLightbox();
        }

        Module.reInitAll = function () {
            this.html.off();
            this.window.trigger('load');
            this.refreshBookmarks();
            this.documentReload();
        }

        Module.reInitPagination = function () {
            this.html.off();
            this.window.trigger('load');
            this.refreshBookmarks();
            this.paginationNextPrev();
            this.paginationLoadMore();
            this.paginationInfinite();
            this.bookmarkToggle();
            this.videoPreview();
            this.hoverTipsy();
        }

        Module.initElementor = function () {
            if ('undefined' !== typeof initDarkMode && !FOXIZ_MAIN_SCRIPTS.editorDarkModeInit) {
                FOXIZ_MAIN_SCRIPTS.editorDarkModeInit = true;
                initDarkMode();
            }
            FOXIZ_MAIN_SCRIPTS.breakingNews();
            FOXIZ_MAIN_SCRIPTS.carousels();
            FOXIZ_MAIN_SCRIPTS.sliders();
        }

        Module.isRTL = function () {
            return this.body.hasClass('rtl');
        }

        Module.animationFrame = function (callback) {
            var func = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                window.webkitRequestAnimationFrame || this.animationFrameFallback
            func.call(window, callback)
        }

        Module.animationFrameFallback = function (callback) {
            window.setTimeout(callback, 1000 / 60)
        }

        /** on load */
        Module.delayLoad = function () {
            var self = this;
            setTimeout(function () {
                self.stickyNavBar();
                self.stickyHeaderBuilder();
            }, 100)
        }

        /** resize */
        Module.browserResize = function () {
            var self = this;
            self.window.on('resize', function () {
                self.topSpacing();
                self.calcSubMenuPos();
            })
        }

        /* ================================ HEADERS ================================ */
        Module.hoverTipsy = function () {

            if (typeof $.fn.rbTipsy === 'undefined') {
                return false;
            }

            this.body.find('[data-copy]').rbTipsy({
                title: 'data-copy',
                fade: true,
                opacity: 1,
                trigger: 'hover',
                gravity: 'n'
            });

            if (window.innerWidth > 1024) {
                this.body.find('[data-title]').rbTipsy({
                    title: 'data-title',
                    fade: true,
                    opacity: 1,
                    trigger: 'hover',
                    gravity: 'n'
                });
            }
        }

        /** font resizer */
        Module.fontResizer = function () {
            var self = this;
            var size;
            if (navigator.cookieEnabled) {
                size = sessionStorage.getItem('rubyResizerStep');
            }
            if (!size) {
                size = 1;
            }

            $('.font-resizer-trigger').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                size++;
                if (3 < size) {
                    size = 1;
                    self.body.removeClass('medium-entry-size big-entry-size')
                } else {
                    if (2 == size) {
                        self.body.addClass('medium-entry-size').removeClass('big-entry-size');
                    } else {
                        self.body.addClass('big-entry-size').removeClass('medium-entry-size')
                    }
                }
                if (navigator.cookieEnabled) {
                    sessionStorage.setItem('rubyResizerStep', size);
                }
            });
        }

        /** hover */
        Module.hoverEffects = function () {
            var selectors = $('.effect-fadeout');
            if (selectors.length > 0) {
                selectors.off('mouseenter mouseleave').on('mouseenter', function (e) {
                    e.stopPropagation();
                    var target = $(this);
                    if (!target.hasClass('activated')) {
                        target.addClass('activated');
                    }
                }).on('mouseleave', function () {
                    $(this).removeClass('activated');
                });
            }
        }

        Module.videoPreview = function () {
            var playPromise;
            $('.preview-trigger').on('mouseenter', function (e) {
                var target = $(this);
                var wrap = target.find('.preview-video');
                if (!wrap.hasClass('video-added')) {
                    var video = '<video preload="auto" muted loop><source src="' + wrap.data('source') + '" type="' + wrap.data('type') + '"></video>';
                    wrap.append(video).addClass('video-added');
                }
                target.addClass('show-preview');
                wrap.css('z-index', 3);
                var el = target.find('video')[0];
                if (el) {
                    playPromise = el.play();
                }
            }).on('mouseleave', function () {
                var target = $(this);
                target.find('.preview-video').css('z-index', 1);
                var el = target.find('video')[0];
                if (el && playPromise !== undefined) {
                    playPromise.then(_ => {
                        el.pause();
                    }).catch(error => {
                    });
                }
            });
        }

        Module.playerAutoPlay = function () {
            var self = this;
            var items = $('.is-autoplay');
            var nonResIframe = $('.entry-content > iframe');

            if (items != null && items.length > 0) {
                items.each(function () {
                    var el = $(this);
                    if (!el.hasClass('is-loaded')) {
                        self.wPoint['iframe'] = new Waypoint({
                            element: el,
                            handler: function () {
                                var iframe = el.find('iframe');
                                self.initAutoPlay(iframe);
                                el.addClass('is-loaded');
                                this.destroy();
                            },
                            offset: '60%'
                        });
                    }
                })
            }

            if (nonResIframe != null && nonResIframe.length > 0) {
                nonResIframe.each(function () {
                    var el = $(this);
                    if (!el.hasClass('is-loaded')) {
                        var iURL = el.attr('src');
                        if (iURL.indexOf('youtube.com') > 0 || iURL.indexOf('youtu.be') > 0 || iURL.indexOf('vimeo.com') > 0) {
                            el.wrap('<div class="rb-ires is-loaded"></div>');
                        }
                    }
                })
            }
        }

        Module.initAutoPlay = function (item) {
            if (item.length > 0 && undefined !== item[0]) {
                var src = item[0].src;
                if (src.indexOf('?') > -1) {
                    item[0].src += "&autoplay=1";
                } else {
                    item[0].src += "?autoplay=1";
                }
            }
        }

        Module.tocToggle = function () {
            $('.ruby-toc-toggle').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var target = $(this);
                var content = target.parents('.ruby-table-contents').find('.inner');
                target.toggleClass('activate');
                content.toggle('250');
            })
        }

        /** Header JS functions */
        Module.headerDropdown = function () {

            var self = this;
            $('.more-trigger').on('click', function (e) {

                /** re calc menu  */
                self.calcSubMenuPos();

                e.preventDefault();
                e.stopPropagation();
                var target = $(this);
                var holder = target.parents('.header-wrap').find('.more-section-outer');

                if (!holder.hasClass('dropdown-activated')) {
                    self.body.find('.dropdown-activated').removeClass('dropdown-activated');
                    holder.addClass('dropdown-activated');
                } else {
                    holder.removeClass('dropdown-activated');
                }

                if (target.hasClass('search-btn')) {
                    setTimeout(function () {
                        holder.find('input[type="text"]').focus()
                    }, 50);
                }

                return false;
            });

            /** search trigger */
            $('.search-trigger').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var holder = $(this).parent('.header-dropdown-outer');
                if (!holder.hasClass('dropdown-activated')) {
                    self.body.find('.dropdown-activated').removeClass('dropdown-activated');
                    holder.addClass('dropdown-activated');
                    setTimeout(function () {
                        holder.find('input[type="text"]').focus()
                    }, 50);

                } else {
                    holder.removeClass('dropdown-activated');
                }
                return false;
            });

            /** header dropdown */
            $('.dropdown-trigger').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var holder = $(this).parent('.header-dropdown-outer');
                if (!holder.hasClass('dropdown-activated')) {
                    self.body.find('.dropdown-activated').removeClass('dropdown-activated');
                    holder.addClass('dropdown-activated');
                } else {
                    holder.removeClass('dropdown-activated');
                }
            });
        }

        Module.topSpacing = function () {
            var self = this;
            if (self.body.hasClass('top-spacing')) {
                var height = $('.top-site-ad').outerHeight();
                $('.site-outer').css('margin-top', height);
            }
        }

        /** outside click */
        Module.documentClick = function () {

            var self = this;
            var wrapper = $('.more-section-outer, .header-dropdown-outer, .mobile-collapse, .mfp-wrap');
            var fullSearch = $('.logo-sec-right .live-search-form-outer');
            document.addEventListener('click', function (e) {
                if (!wrapper.is(e.target) && wrapper.has(e.target).length === 0) {
                    wrapper.removeClass('dropdown-activated');
                    self.outerHTML.removeClass('collapse-activated');
                }

                if (!fullSearch.is(e.target) && fullSearch.has(e.target).length === 0) {
                    fullSearch.find('.live-search-response').fadeOut(500);
                }
            });
        }

        /** calc mega menu position */
        Module.initSubMenuPos = function () {
            var self = this;
            var trigger = false;

            /** add delay to ensure image loaded */
            setTimeout(function () {
                self.calcSubMenuPos();
            }, 1000);

            /** re calc when hovering */
            $('.menu-has-child-mega').on('mouseenter', function (e) {
                if (!trigger) {
                    self.calcSubMenuPos();
                }
                trigger = true;
            })
        }

        Module.calcSubMenuPos = function () {

            if (window.outerWidth < 1024) {
                return false;
            }

            var self = this;
            var megaParents = $('.menu-has-child-mega');
            var headerWrapper = $('#site-header');

            /** for mega wide */
            if (megaParents.length > 0) {
                megaParents.each(function () {
                    var item = $(this);
                    item.find('.mega-dropdown').css({
                        'width': self.body.width(),
                        'left': -item.offset().left,
                    });
                    item.addClass('mega-menu-loaded')
                })
            }

            /** sub-menu left right direction */
            if (headerWrapper.length > 0) {

                var headerLeftOffset = headerWrapper.offset().left;
                var headerWidth = headerWrapper.width();
                var headerRightOffset = headerLeftOffset + headerWidth;
                var flexDropdown = $('.flex-dropdown');

                /** sub menu direction */
                var subElements = $('ul.sub-menu');
                if (subElements.length > 0) {
                    subElements.each(function () {
                        var item = $(this);
                        var itemLeftOffset = item.offset().left;
                        var itemRightOffset = itemLeftOffset + item.width() + 100;
                        if (itemRightOffset > headerRightOffset) {
                            item.addClass('left-direction');
                        }
                    })
                }

                /** calc dropdown flex width */
                if (flexDropdown.length > 0) {
                    flexDropdown.each(function () {
                        var item = $(this);
                        var parentItem = item.parent();
                        if (parentItem.hasClass('is-child-wide') || item.hasClass('mega-has-left')) {
                            return;
                        }
                        var itemWidth = item.width();
                        var itemHalfWidth = itemWidth / 2;
                        var parentItemOffset = parentItem.offset().left;
                        var parentHalfWidth = parentItem.width() / 2;
                        var parentItemCenterOffset = parentItemOffset + parentHalfWidth;
                        var rightSpacing = headerRightOffset - parentItemCenterOffset;
                        var leftSpacing = parentItemCenterOffset - headerLeftOffset;

                        if (itemWidth >= headerWidth) {
                            item.css({
                                'width': headerWidth - 2,
                                'left': -parentItemOffset
                            });
                        } else if (itemHalfWidth > rightSpacing) {
                            item.css({
                                'right': -rightSpacing + parentHalfWidth + 1,
                                'left': 'auto',
                            });
                        } else if (itemHalfWidth > leftSpacing) {
                            item.css({
                                'left': -leftSpacing + parentHalfWidth + 1,
                                'right': 'auto',
                            });
                        } else {
                            item.css({
                                'right': 'auto',
                                'left': -itemHalfWidth + parentHalfWidth,
                            });
                        }
                    });
                }
            }
        }

        /**
         *
         * @returns {boolean}
         */
        Module.stickyNavBar = function () {

            var self = this;

            /** turn off sticky on editor mode */
            if (self.body.hasClass('elementor-editor-active')) {
                return false;
            }

            self.sticky.section = $('#sticky-holder');
            self.sticky.outer = $('#navbar-outer');

            if ((!self.body.hasClass('is-mstick') && !self.body.hasClass('yes-tstick')) || self.sticky.outer.length < 1 || self.sticky.section.length < 1) {
                return false;
            }

            self.sticky.smartSticky = !!self.body.hasClass('is-smart-sticky');
            self.sticky.isSticky = false;
            self.sticky.lastScroll = 0;


            if (self.body.hasClass('yes-tstick')) {
                self.sticky.isTitleSticky = true;
            } else {
                self.sticky.isTitleSticky = 0;
            }

            self.sticky.additionalOffset = 200;
            if (window.innerWidth > 1024) {
                if (self.sticky.isTitleSticky) {
                    self.sticky.additionalOffset = 450;
                } else {
                    self.sticky.additionalOffset = 0;
                }
            }

            if (self.body.hasClass('admin-bar')) {
                self.sticky.adminBarSpacing = 32;
            } else {
                self.sticky.adminBarSpacing = 0;
            }

            self.sticky.topOffset = self.sticky.section.offset().top;
            self.sticky.stickySectionHeight = self.sticky.section.outerHeight();

            self.sticky.outer.css('min-height', self.sticky.outer.outerHeight());
            self.sticky.activatePos = self.sticky.topOffset + 1 + self.sticky.stickySectionHeight + self.sticky.additionalOffset;
            self.sticky.deactivePos = self.sticky.topOffset - self.sticky.adminBarSpacing + self.sticky.additionalOffset;

            if (window.addEventListener) {
                if (self.sticky.smartSticky) {
                    window.addEventListener('scroll', function () {
                        self.animationFrame(self.initSmartStickyNavBar.bind(self));
                    }, false);
                } else {
                    window.addEventListener('scroll', function () {
                        self.animationFrame(self.initStickyNavBar.bind(self));
                    }, false);
                }
            }

            self.window.on('unstickMenu', function () {
                self.sticky.outer.css('min-height', self.sticky.outer.outerHeight());
                self.sticky.stickySectionHeight = self.sticky.section.outerHeight();
                self.sticky.topOffset = self.sticky.section.offset().top;
                self.sticky.activatePos = self.sticky.topOffset + 1 + self.sticky.stickySectionHeight + self.sticky.additionalOffset;
                self.sticky.deactivePos = self.sticky.topOffset - self.sticky.adminBarSpacing + self.sticky.additionalOffset;
            });
        }

        Module.initStickyNavBar = function () {
            var self = this;
            var scroll = self.window.scrollTop();
            if (!self.sticky.isSticky && scroll > self.sticky.activatePos) {
                self.sticky.isSticky = true;
                self.body.addClass('stick-animated sticky-on');
                self.sticky.stickAnimatedTimeout = setTimeout(function () {
                    self.body.removeClass('stick-animated');
                }, 200);
            } else if (self.sticky.isSticky && scroll <= self.sticky.deactivePos) {
                self.sticky.isSticky = false;
                self.body.removeClass('sticky-on stick-animated');
                self.window.trigger('unstickMenu');
            }
        }

        Module.initSmartStickyNavBar = function () {
            var self = this;
            var scroll = self.window.scrollTop();
            if (!self.sticky.isSticky && scroll > self.sticky.activatePos && scroll < self.sticky.lastScroll) {
                self.sticky.isSticky = true;
                self.body.addClass('stick-animated sticky-on');
                self.sticky.stickAnimatedTimeout = setTimeout(function () {
                    self.body.removeClass('stick-animated');
                }, 200);
            } else if (self.sticky.isSticky && (scroll <= self.sticky.deactivePos || scroll > self.sticky.lastScroll)) {
                self.sticky.isSticky = false;
                self.body.removeClass('sticky-on stick-animated');
                if (scroll <= self.sticky.deactivePos) {
                    self.window.trigger('unstickESection');
                }
            }
            self.sticky.lastScroll = scroll;
        }

        /** header sticky template */
        Module.stickyHeaderBuilder = function () {

            var self = this;

            /** turn off sticky on editor mode */
            if (self.body.hasClass('elementor-editor-active')) {
                return false;
            }

            var stickySection = $('.header-template .e-section-sticky').first();
            var hasTitleSticky = $('body.single-post #s-title-sticky').first();

            if (stickySection.length < 1) {
                return false;
            }

            if (hasTitleSticky.length > 0) {
                self.body.addClass('yes-tstick');
                self.eSticky.isTitleSticky = true;
            } else {
                self.eSticky.isTitleSticky = 0;
            }

            self.eSticky.additionalOffset = 200;
            if (window.innerWidth > 1024) {
                if (self.eSticky.isTitleSticky) {
                    self.eSticky.additionalOffset = 450;
                } else {
                    self.eSticky.additionalOffset = 0;
                }
            }

            self.eSticky.smartSticky = !!stickySection.hasClass('is-smart-sticky');

            /** mobile sticky for header template */
            if (window.innerWidth <= 1024) {
                var mobileHeader = $('#header-template-holder');
                stickySection.removeClass('e-section-sticky');
                mobileHeader.addClass('e-section-sticky');
                stickySection = mobileHeader;
            }

            self.eSticky.section = stickySection;
            self.eSticky.outer = stickySection.parent();

            self.eSticky.adminBarSpacing = 0;
            self.eSticky.isSticky = false;
            self.eSticky.lastScroll = 0;
            self.eSticky.stickySectionHeight = stickySection.outerHeight();
            self.eSticky.topOffset = stickySection.offset().top;

            /** set min height */
            if (self.body.hasClass('admin-bar')) {
                self.eSticky.adminBarSpacing = 32;
            }
            self.eSticky.outer.css('min-height', self.eSticky.outer.outerHeight());
            self.eSticky.activatePos = self.eSticky.topOffset + 1 + self.eSticky.stickySectionHeight + self.eSticky.additionalOffset;
            self.eSticky.deactivePos = self.eSticky.topOffset - self.eSticky.adminBarSpacing + self.eSticky.additionalOffset;

            if (window.addEventListener) {
                if (self.eSticky.smartSticky) {
                    window.addEventListener('scroll', function () {
                        self.animationFrame(self.initSmartStickyESection.bind(self));
                    }, false);
                } else {
                    window.addEventListener('scroll', function () {
                        self.animationFrame(self.initStickyESection.bind(self));
                    }, false);
                }
            }

            /** re-calc height values */
            self.window.on('unstickESection', function () {
                self.eSticky.outer.css('min-height', self.eSticky.outer.outerHeight());
                self.eSticky.stickySectionHeight = self.eSticky.section.outerHeight();
                self.eSticky.topOffset = self.eSticky.section.offset().top;
                self.eSticky.activatePos = self.eSticky.topOffset + 1 + self.eSticky.stickySectionHeight + self.eSticky.additionalOffset;
                self.eSticky.deactivePos = self.eSticky.topOffset - self.eSticky.adminBarSpacing + self.eSticky.additionalOffset;
            });
        }

        Module.initStickyESection = function () {
            var self = this;
            var scroll = self.window.scrollTop();
            if (!self.eSticky.isSticky && scroll > self.eSticky.activatePos) {
                self.eSticky.isSticky = true;
                self.body.addClass('stick-animated sticky-on');
                self.eSticky.stickAnimatedTimeout = setTimeout(function () {
                    self.body.removeClass('stick-animated');
                }, 200);
            } else if (self.eSticky.isSticky && scroll <= self.eSticky.deactivePos) {
                self.eSticky.isSticky = false;
                self.body.removeClass('sticky-on stick-animated');
                self.window.trigger('unstickESection');
            }
        }

        Module.initSmartStickyESection = function () {
            var self = this;
            var scroll = self.window.scrollTop();

            if (!self.eSticky.isSticky && scroll > self.eSticky.activatePos && scroll < self.eSticky.lastScroll) {
                self.eSticky.isSticky = true;
                self.body.addClass('stick-animated sticky-on');
                self.eSticky.stickAnimatedTimeout = setTimeout(function () {
                    self.body.removeClass('stick-animated');
                }, 200);
            } else if (self.eSticky.isSticky && (scroll <= self.eSticky.deactivePos || scroll > self.eSticky.lastScroll)) {
                self.eSticky.isSticky = false;
                self.body.removeClass('sticky-on stick-animated');
                if (scroll <= self.eSticky.deactivePos) {
                    self.window.trigger('unstickESection');
                }
            }

            self.eSticky.lastScroll = scroll;
        }

        /** mobileCollapse */
        Module.mobileCollapse = function () {
            var self = this;
            $('.mobile-menu-trigger').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var target = $(this);
                if (target.hasClass('mobile-search-icon')) {
                    setTimeout(function () {
                        self.outerHTML.find('.mobile-search-form input[type="text"]').focus()
                    }, 50);
                }
                if (!self.outerHTML.hasClass('collapse-activated')) {
                    self.outerHTML.addClass('collapse-activated');
                } else {
                    self.outerHTML.removeClass('collapse-activated');
                }
            });
        }

        /**
         * privacy trigger
         */
        Module.privacyTrigger = function () {
            $('#privacy-trigger').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                localStorage.setItem('RubyPrivacyAllowed', '1');
                $('#rb-privacy').slideUp(250, function () {
                    $(this).remove();
                });
                return false;
            });
        }

        /** back top */
        Module.backTop = function () {
            if (this.body.hasClass('is-backtop')) {
                $().UItoTop({
                    text: '<i class="rbi rbi-darrow-top"></i>',
                });
            }
        }

        Module.SetTTLStorage = function (id, value, ttl) {
            var data = {
                value: value,
                ttl: Date.now() + ttl * 3600000
            }
            localStorage.setItem(id, JSON.stringify(data));
        }

        Module.getTTLStorage = function (id) {
            var data = localStorage.getItem(id);
            if (!data) {
                return null;
            }

            data = JSON.parse(data);
            if (Date.now() > data.ttl) {
                localStorage.removeItem(data);
                return null;
            }

            return data.value;
        }

        /** login popup */
        Module.loginPopup = function () {
            var toggle = $('.login-toggle');
            var form = $('#rb-user-popup-form');
            toggle.css('pointer-events', 'auto');
            if (toggle.length > 0 && form.length > 0) {
                toggle.on('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    $.magnificPopup.open({
                        type: 'inline',
                        preloader: false,
                        removalDelay: 500,
                        showCloseBtn: true,
                        closeBtnInside: true,
                        closeOnBgClick: true,
                        items: {
                            src: form,
                            type: 'inline'
                        },
                        mainClass: 'popup-animation',
                        closeMarkup: '<span class="close-popup-btn mfp-close"><span class="close-icon"></span></span>',
                        fixedBgPos: true,
                        fixedContentPos: true
                    });
                })
            }
        }

        /**
         * newsletter
         */
        Module.popupNewsletter = function () {

            var self = this;

            var target = $('#rb-popup-newsletter');
            if (target.length > 0) {
                var display = target.data('display');
                self.newsletterExpired = target.data('expired');
                self.newsletterDisplayOffset = target.data('offset');
                var delay = target.data('delay');
                var oldExpired = localStorage.getItem('RubyNewsletterExpired');
                if (!oldExpired || self.newsletterExpired != oldExpired) {
                    localStorage.setItem('RubyNewsletterExpired', self.newsletterExpired);
                    localStorage.removeItem('RubyNewsletter');
                }
                if (!self.getTTLStorage('RubyNewsletter')) {
                    if (!display || 'scroll' == display) {
                        if (window.addEventListener) {
                            window.addEventListener('scroll', function () {
                                self.animationFrame(self.scrollPopupNewsletter.bind(self));
                            }, false);
                        }
                    } else {
                        setTimeout(function () {
                            self.popupNewsletterInit();
                        }, delay);
                    }
                }
            }
        }

        Module.scrollPopupNewsletter = function () {
            var self = this;
            if (!self.newsletterPopupFlag && self.window.scrollTop() > self.newsletterDisplayOffset) {
                self.newsletterPopupFlag = true;
                self.popupNewsletterInit();
            }
        }

        Module.popupNewsletterInit = function () {
            var self = this;

            if (self.siteAccessFlag) {
                return;
            }

            $.magnificPopup.open({
                type: 'inline',
                preloader: false,
                closeBtnInside: true,
                removalDelay: 300,
                showCloseBtn: true,
                closeOnBgClick: false,
                disableOn: 1024,
                items: {
                    src: '#rb-popup-newsletter',
                    type: 'inline'
                },
                mainClass: 'popup-animation',
                fixedBgPos: true,
                fixedContentPos: true,
                closeMarkup: '<span class="close-popup-btn mfp-close"><span class="close-icon"></span></span>',
                callbacks: {
                    close: function () {
                        if (self.siteAccessFlag) {
                            return;
                        }
                        self.SetTTLStorage('RubyNewsletter', 1, self.newsletterExpired * 24);
                    }
                }
            });
        }

        /** footer slide up */
        Module.footerSlideUp = function () {
            var target = $('#footer-slideup');
            if (target.length > 0) {
                var self = this;
                self.footerSlideUpExpired = target.data('expired');
                var delay = target.data('delay');
                var oldExpired = localStorage.getItem('footerSlideUpExpired');
                if (!oldExpired || self.footerSlideUpExpired != oldExpired) {
                    localStorage.setItem('footerSlideUpExpired', self.footerSlideUpExpired);
                    localStorage.removeItem('footerSlideUp');
                }
                if (!self.getTTLStorage('footerSlideUp')) {
                    setTimeout(function () {
                        self.footerSlideUpInit();
                    }, delay);
                }
                /** show hide toggle */
                setTimeout(function () {
                    self.footerSlideUpToggle();
                }, delay);
            }
        }

        Module.footerSlideUpToggle = function () {
            var self = this;
            $('.slideup-toggle').off('click').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.footerSlideUpInit();
                return false;
            });
        }

        Module.footerSlideUpInit = function () {
            if (this.body.hasClass('yes-f-slideup')) {
                this.body.removeClass('yes-f-slideup');
                this.SetTTLStorage('footerSlideUp', 1, this.footerSlideUpExpired * 24);
            } else {
                this.body.addClass('yes-f-slideup');
                localStorage.removeItem('footerSlideUp');
            }
        }


        /** youtube iframe */
        Module.loadYoutubeIframe = function () {

            var self = this;
            var blockPlaylist = $('.yt-playlist');
            if (blockPlaylist.length > 0) {
                var tag = document.createElement('script');
                tag.src = "//www.youtube.com/iframe_api";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            }

            window.onYouTubeIframeAPIReady = function () {
                $('.yt-playlist').each(function () {
                    var target = $(this);
                    var iframe = target.find('.yt-player');
                    var videoID = target.data('id');
                    var blockID = target.data('block');
                    self.YTPlayers[blockID] = new YT.Player(iframe.get(0), {
                        height: '540',
                        width: '960',
                        videoId: videoID,
                        events: {
                            'onReady': self.videoPlayToggle,
                            'onStateChange': self.videoPlayToggle
                        }
                    });
                });
                $('.plist-item').on('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    var wrapper = $(this).parents('.yt-playlist');
                    var currentBlockID = wrapper.data('block');
                    var videoID = $(this).data('id');
                    var title = $(this).text();
                    var meta = $(this).data('index');
                    Object.keys(self.YTPlayers).forEach(function (id) {
                        self.YTPlayers[id].pauseVideo();
                    });
                    self.YTPlayers[currentBlockID].loadVideoById({
                        'videoId': videoID
                    });

                    wrapper.find('.yt-trigger').addClass('is-playing');
                    wrapper.find('.play-title').hide().text(title).fadeIn(250);
                    wrapper.find('.video-index').text(meta);
                });
            }
        }

        Module.videoPlayToggle = function () {
            var players = FOXIZ_MAIN_SCRIPTS.YTPlayers;
            $('.yt-trigger').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                var target = $(this);
                var currentBlockID = target.parents('.yt-playlist').data('block');
                var currentState = players[currentBlockID].getPlayerState();
                if (-1 == currentState || 0 == currentState || 2 == currentState || 5 == currentState) {
                    players[currentBlockID].playVideo();
                    target.addClass('is-playing');
                } else {
                    players[currentBlockID].pauseVideo();
                    target.removeClass('is-playing');

                }
            })
        }


        /** Comment scripts */
        Module.showPostComment = function () {
            $('.show-post-comment').off('click').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var wrap = $(this).parent();
                $(this).fadeOut(250, function () {
                    $(this).remove();
                    wrap.find('.is-invisible').removeClass('is-invisible');
                    wrap.next('.comment-holder').removeClass('is-hidden');
                })
            });
        }

        /** table scroll */
        Module.scrollTableContent = function () {
            var self = this;
            $('.anchor-link').on('click', function (e) {
                e.stopPropagation();

                /** support special language */
                var target = $(this).data('index');
                self.html.animate({
                    scrollTop: $('.' + target).offset().top - 75
                }, 400);
            });
        }

        /** scroll to comment  */
        Module.scrollToComment = function () {
            var commentBtn = $('.show-post-comment');
            var self = this;
            if (commentBtn.length > 0) {
                var hash = window.location.hash;
                if ('#respond' == hash || '#comment' == hash.substring(0, 8)) {
                    commentBtn.trigger('click');
                    self.html.animate({scrollTop: commentBtn.offset().top}, 400);
                }
            }
        }

        Module.replyReview = function () {
            var replyLink = $('.comment-reply-link');
            replyLink.on('click', function () {
                var target = $(this);
                var wrapper = target.parents('.rb-reviews-area');
                if (wrapper.length > 0) {
                    var cancelLink = $('#cancel-comment-reply-link');
                    wrapper.find('.rb-form-rating').addClass('is-hidden');
                    cancelLink.on('click', function () {
                        wrapper.find('.rb-form-rating').removeClass('is-hidden');
                    });
                }
            });
        }

        /** user rating */
        Module.usersRating = function () {
            var self = this;
            var reviewsForm = self.body.find('.rb-reviews-form');
            if (reviewsForm.length > 0) {
                reviewsForm.each(function () {
                    var reviewForm = $(this);
                    if (!reviewForm.hasClass('is-loaded')) {
                        reviewForm.addClass('is-loaded');
                        var ratingForm = reviewForm.find('.rb-form-rating');
                        var selection = reviewForm.find('.rb-rating-selection');
                        var text = reviewForm.find('.rating-alert').html();
                        var ratingValue = null;
                        selection.val('');
                        selection.hide();
                        selection.before(
                            '<div class="rb-review-stars">\
                                <span>\
                                    <a class="star" data-rating="1" href="#"><i class="rbi rbi-star-o"></i></a>\
                                    <a class="star" data-rating="2" href="#"><i class="rbi rbi-star-o"></i></a>\
                                    <a class="star" data-rating="3" href="#"><i class="rbi rbi-star-o"></i></a>\
                                    <a class="star" data-rating="4" href="#"><i class="rbi rbi-star-o"></i></a>\
                                    <a class="star" data-rating="5" href="#"><i class="rbi rbi-star-o"></i></a>\
                                </span>\
                            </div>'
                        );

                        ratingForm.on('click', 'a.star', function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            var star = $(this);
                            ratingValue = star.data('rating');
                            star.siblings('a').removeClass('active');
                            star.addClass('active');
                            ratingForm.addClass('selected');
                        });

                        reviewForm.on('click', '#respond #submit', function () {
                            selection.val(ratingValue);
                            if (!selection.val()) {
                                window.alert(text);
                                return false;
                            }
                        });
                    }
                });
            }
        }

        /**
         *
         * @returns {boolean}
         */
        Module.readIndicatorInit = function () {

            var self = this;

            if (!self.body.hasClass('single-post') || self.readIndicator.length < 1) {
                return false;
            }

            var content = $('.entry-content');
            if (content.length < 1) {
                return false;
            }
            content = content.eq(0);
            self.indicatorTop = content.offset().top;
            self.indicatorHeight = content.outerHeight(true) - self.window.height();
            if (window.addEventListener) {
                window.addEventListener('scroll', function () {
                    self.animationFrame(self.readIndicatorCalc.bind(self));
                }, false);
            }
        }

        Module.readIndicatorCalc = function () {
            var self = this;
            var scroll = self.window.scrollTop();
            self.readIndicatorPercent = ((scroll - self.indicatorTop) / self.indicatorHeight) * 100;
            if (self.readIndicatorPercent <= 130) {
                self.readIndicator.css('width', self.readIndicatorPercent + '%');
            }
        }

        /** breaking news */
        Module.breakingNews = function () {
            var self = this;
            var breakingNews = $('.breaking-news-slider');
            if (breakingNews.length < 1) {
                return false;
            }
            breakingNews.each(function () {
                var el = $(this);
                var params = {
                    slidesPerView: 1,
                    loop: true,
                }
                if (el.data('play')) {
                    params.autoplay = {
                        delay: self.themeSettings.sliderSpeed,
                        pauseOnMouseEnter: true,
                        stopOnLastSlide: true,
                        disableOnInteraction: true,
                    }
                    if (el.data('speed')) {
                        params.autoplay.delay = el.data('speed');
                    }
                }
                if ('undefined' !== typeof self.isElementorEditor) {
                    delete params.autoplay;
                }
                params.navigation = {
                    nextEl: el.find('.breaking-news-next')[0],
                    prevEl: el.find('.breaking-news-prev')[0]
                }
                new RBSwiper(this, params);
            });
        }

        /** overlay slider */
        Module.sliders = function () {

            var self = this;
            var sliders = $('.post-slider');
            if (sliders.length < 1) {
                return false;
            }

            sliders.each(function () {
                var slider = $(this);
                var params = {
                    grabCursor: true,
                    allowTouchMove: true,
                    effect: self.themeSettings.sliderEffect,
                    loop: true,
                }
                if (slider.data('play')) {
                    params.autoplay = {
                        delay: self.themeSettings.sliderSpeed,
                        pauseOnMouseEnter: true,
                        stopOnLastSlide: true,
                        disableOnInteraction: true,
                    }
                    if (slider.data('speed')) {
                        params.autoplay.delay = slider.data('speed');
                    }
                }
                if ('undefined' !== typeof self.isElementorEditor) {
                    delete params.autoplay;
                }
                params.pagination = {
                    el: slider.find('.slider-pagination')[0],
                    clickable: true,
                };

                params.navigation = {
                    nextEl: slider.find('.slider-next')[0],
                    prevEl: slider.find('.slider-prev')[0]
                }
                new RBSwiper(this, params);
            });
        }


        /** carousel blocks */
        Module.carousels = function () {
            var self = this;
            var carousels = $('.post-carousel');
            if (carousels.length < 1) {
                return false;
            }
            carousels.each(function () {
                var carousel = $(this);
                var params = {
                    grabCursor: true,
                    allowTouchMove: true,
                    freeMode: false,
                    loop: true
                }
                params.slidesPerView = carousel.data('mcol');
                params.spaceBetween = carousel.data('mgap');
                params.centeredSlides = carousel.data('centered');

                params.navigation = {
                    nextEl: carousel.find('.slider-next')[0],
                    prevEl: carousel.find('.slider-prev')[0]
                }
                if (carousel.find('.slider-pagination')[0]) {
                    params.pagination = {
                        el: carousel.find('.slider-pagination')[0],
                        type: 'bullets',
                        clickable: true,
                    };
                }
                if (carousel.data('play')) {
                    params.autoplay = {
                        delay: self.themeSettings.sliderSpeed,
                        pauseOnMouseEnter: true,
                        stopOnLastSlide: true,
                        disableOnInteraction: true,
                    }

                    if (carousel.data('speed')) {
                        params.autoplay.delay = carousel.data('speed');
                    }
                }
                if ('undefined' !== typeof self.isElementorEditor) {
                    delete params.autoplay;
                }
                if (carousel.data('fmode')) {
                    params.freeMode = true;
                }
                params.breakpoints = {
                    768: {
                        slidesPerView: carousel.data('tcol'),
                        spaceBetween: carousel.data('tgap')
                    },
                    1025: {
                        slidesPerView: carousel.data('col'),
                        spaceBetween: carousel.data('gap')
                    },
                    1500: {
                        slidesPerView: carousel.data('wcol'),
                        spaceBetween: carousel.data('gap')
                    }
                };
                params.on = {
                    afterInit: function (swiper) {
                        var wrap = $(swiper.$wrapperEl);
                        $(swiper.$wrapperEl).find('.p-box').css('height', wrap.height());
                    },
                    resize: function (swiper) {
                        var wrap = $(swiper.$wrapperEl);
                        $(swiper.$wrapperEl).find('.p-box').css('height', wrap.height());
                    },
                };

                new RBSwiper(this, params);
            });
        }


        /* ================================ SINGLE GALLERY ================================ */
        Module.singleGallery = function () {
            var self = this;
            var gallerySections = self.body.find('.featured-gallery-wrap');
            if (!gallerySections.length) {
                return;
            }

            gallerySections.each(function () {
                var section = $(this);
                if (!section.hasClass('is-loaded')) {
                    var index = section.data('gallery');
                    var sliderEl = section.find('.gallery-slider').attr('id');
                    var sliderNavEl = section.find('.gallery-slider-nav').attr('id');
                    var carouselEl = section.find('.gallery-carousel').attr('id');
                    var coverflowEL = section.find('.gallery-coverflow').attr('id');

                    if ('undefined' !== typeof sliderEl && 'undefined' !== typeof sliderNavEl) {
                        var galleryNav = new RBSwiper('#' + sliderNavEl, {
                            spaceBetween: 15,
                            slidesPerView: 6,
                            freeMode: self.themeSettings.sliderFMode,
                            grabCursor: true,
                            loop: true,
                            watchSlidesVisibility: true,
                            watchSlidesProgress: true,
                            on: {
                                init: function () {
                                    $(this.$wrapperEl).removeClass('pre-load');
                                },
                            },
                        });

                        var gallerySlider = new RBSwiper('#' + sliderEl, {
                            spaceBetween: 0,
                            grabCursor: true,
                            loop: true,
                            pagination: {
                                el: '.swiper-pagination-' + index,
                                type: 'progressbar',
                                clickable: true,
                            },
                            on: {
                                init: function () {
                                    section.addClass('is-loaded');
                                },
                            },
                            thumbs: {
                                swiper: galleryNav
                            }
                        });

                        gallerySlider.on('slideChange', function () {
                            if (this.activeIndex) {
                                $(this.$el).next().find('.current-slider-count').fadeOut(0).html(this.activeIndex).fadeIn(250);
                            }
                        });
                    }

                    if ('undefined' !== typeof carouselEl) {
                        new RBSwiper('#' + carouselEl, {
                            spaceBetween: 20,
                            slidesPerView: 'auto',
                            freeMode: self.themeSettings.sliderFMode,
                            loop: false,
                            grabCursor: true,
                            scrollbar: {
                                el: '.swiper-scrollbar-' + index,
                                hide: true,
                            },
                            on: {
                                init: function () {
                                    $(this.$wrapperEl).removeClass('pre-load');
                                    section.addClass('is-loaded');
                                },
                            },
                        });
                    }

                    if ('undefined' !== typeof coverflowEL) {
                        new RBSwiper('#' + coverflowEL, {
                            effect: "coverflow",
                            grabCursor: true,
                            centeredSlides: true,
                            slidesPerView: 1.2,
                            coverflowEffect: {
                                rotate: 50,
                                stretch: 0,
                                depth: 250,
                                modifier: 1,
                                slideShadows: true,
                            },
                            breakpoints: {
                                768: {
                                    slidesPerView: 3
                                }
                            },
                            on: {
                                init: function () {
                                    $(this.$wrapperEl).removeClass('pre-load');
                                    section.addClass('is-loaded');
                                },
                            },
                            pagination: {
                                el: '.swiper-pagination-' + index,
                                clickable: true,
                            },
                        });
                    }
                }
            });
        }

        Module.highlightShares = function () {
            var self = this;
            if (!self.themeSettings.highlightShares || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)) {
                return;
            }
            var extra = [];
            var config = {
                selectableElements: ['.is-highlight-shares'],
                twitterUsername: self.themeSettings.twitterName,
            };
            if (self.themeSettings.highlightShareFacebook) {
                config.facebook = true;
            }
            if (self.themeSettings.highlightShareTwitter) {
                config.twitter = true;
            }
            if (self.themeSettings.highlightShareReddit) {
                extra.push({
                    icon: '<i class="rbi rbi-reddit"></i>',
                    url: 'https://reddit.com/submit?url=PAGE_URL&title=TEXT_SELECTION'
                });
            }
            Sharect.config(config).appendCustomShareButtons(extra).init();
        }

        /**
         *
         * @returns {boolean}
         */
        Module.floatingVideo = function () {

            var self = this;
            var floating = $('.floating-video').not('.is-loaded');
            if (floating.length < 1 || window.outerWidth < 1025) {
                return false;
            }
            self.wPoint['Floating'] = new Waypoint({
                element: floating,
                offset: -floating.height(),
                handler: function (direction) {
                    self.body.find('.floating-video').addClass('is-loaded').removeClass('floating-activated');
                    self.body.find('.floating-close').remove();
                    if ('down' == direction) {
                        this.element.addClass(' floating-activated');
                        this.element.find('.float-holder').prepend('<a class="floating-close close-popup-btn" href="#"><span class="close-icon"></span></a>');
                    }
                }
            });
        }

        Module.floatingVideoRemove = function () {
            var self = this;
            self.body.on('click', '.floating-close', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.body.find('.floating-video').removeClass('floating-activated');
                self.wPoint['Floating'].destroy();
            })
        }

        /* ================================ BOOKMARKS ================================ */
        Module.myBookmarks = function () {
            var self = this;
            var myBookmarks = $('#my-bookmarks');
            var myCategories = $('#my-categories');
            var myAuthors = $('#my-authors');
            var myRecommended = $('#my-recommended');

            if (myBookmarks.length < 1) {
                return false;
            }

            $.ajax({
                type: 'POST',
                url: self.themeSettings.ajaxurl,
                data: {
                    action: 'my_bookmarks'
                },
                success: function (response) {
                    response = JSON.parse(JSON.stringify(response));

                    if (response.sync) {
                        self.bookmarkData = response.sync;
                    }
                    var listPosts = $(response.listposts);
                    var remove = $(response.remove);
                    var posts = listPosts.find('.p-wrap');
                    if (posts.length > 0) {
                        $.each(posts, function () {
                            var post = $(this);
                            var temp = remove.clone();
                            temp.data('pid', post.data('pid'));
                            post.find('.feat-holder').append(temp);
                        });
                    }

                    myBookmarks.fadeOut(150, function () {
                        myBookmarks.html(listPosts);
                        myBookmarks.fadeIn(400);
                    });
                    if (myCategories.length > 0) {
                        myCategories.fadeOut(150, function () {
                            myCategories.html(response.categories).fadeIn(400);
                        });
                    }
                    if (myAuthors.length > 0) {
                        myAuthors.fadeOut(150, function () {
                            myAuthors.html(response.authors).fadeIn(400);
                        });
                    }

                    if (myRecommended.length > 0) {
                        myRecommended.fadeOut(150, function () {
                            myRecommended.html(response.recommended).fadeIn(400);
                        });
                    }

                    /** reload buttons */
                    setTimeout(function () {
                        Waypoint.refreshAll();
                        self.syncBookmarkCSS(response.sync);
                        self.removeBookmark();
                        self.followToggle();
                        self.reInitPagination();
                    }, 600);
                }
            });
        }

        Module.syncBookmark = function () {
            var self = this;
            if (self.body.hasClass('sync-bookmarks') && !self.body.hasClass('page-template-bookmark')) {
                var notificationWrap = $('.notification-bookmark');
                $.ajax({
                    type: 'POST',
                    url: self.themeSettings.ajaxurl,
                    data: {
                        action: 'sync_bookmarks',
                        notification: notificationWrap.length
                    },
                    success: function (response) {
                        self.bookmarkData = JSON.parse(JSON.stringify(response));
                        self.syncBookmarkCSS(self.bookmarkData);
                        if (response.notification) {
                            notificationWrap.html(response.notification);
                        }
                    }
                });
            }
        }

        Module.refreshBookmarks = function () {
            if (this.bookmarkData !== undefined) {
                this.syncBookmarkCSS(this.bookmarkData);
            }
        }

        /**
         *
         * @param response
         */
        Module.syncBookmarkCSS = function (response) {

            $.each(response.posts, function (index, val) {
                $('.bookmark-trigger[data-pid=' + val + ']').css('opacity', 0).addClass('bookmarked').animate({opacity: 1}, 250);
            });
            $.each(response.categories, function (index, val) {
                $('.follow-trigger[data-cid=' + val + ']').addClass('followed');
            });
            $.each(response.authors, function (index, val) {
                $('.follow-trigger[data-uid=' + val + ']').addClass('followed');
            });
            /** show button loaded */
            $('.follow-button').animate({opacity: 1}, 200);
        }

        Module.bookmarkToggle = function () {
            var self = this;
            $('.bookmark-trigger').off('click').on('click', function (e) {

                e.preventDefault();
                e.stopPropagation();

                var target = $(this);
                var pid = target.data('pid');
                var infoTemplate = $('#bookmark-toggle-info');

                if (!pid || self.bookmarkProgressing) {
                    return false;
                }

                self.bookmarkProgressing = true;
                target.addClass('in-progress');
                clearTimeout(self.timeOut);

                $.ajax({
                    type: 'POST',
                    url: self.themeSettings.ajaxurl,
                    data: {
                        action: 'rb_bookmark',
                        pid: pid
                    },
                    success: function (response) {
                        response = JSON.parse(JSON.stringify(response));
                        if ('added' === response.action) {
                            $('.bookmark-trigger[data-pid=' + pid + ']').css('opacity', 0).addClass('bookmarked').animate({opacity: 1}, 250);
                            infoTemplate.removeClass('removed bookmark-limited');
                            infoTemplate.addClass('added');
                        } else if ('removed' === response.action) {
                            $('.bookmark-trigger[data-pid=' + pid + ']').css('opacity', 0).removeClass('bookmarked').animate({opacity: 1}, 250);
                            infoTemplate.removeClass('added bookmark-limited');
                            infoTemplate.addClass('removed');
                        } else if ('limit' === response.action) {
                            infoTemplate.addClass('bookmark-limited');
                        }

                        if (infoTemplate.length) {
                            infoTemplate.fadeOut(100, function () {
                                infoTemplate.find('.bookmark-featured').html(response.image);
                                infoTemplate.find('.bookmark-title').html(response.title);
                                infoTemplate.find('.bookmark-desc').html(response.description);

                                infoTemplate.fadeIn(300);
                                self.timeOut = setTimeout(function () {
                                    infoTemplate.fadeOut(600);
                                }, 2000);
                            });
                            infoTemplate.on({
                                mouseenter: function () {
                                    clearTimeout(self.timeOut);
                                },
                                mouseleave: function () {
                                    self.timeOut = setTimeout(function () {
                                        infoTemplate.fadeOut(600);
                                    }, 1200);
                                }
                            });
                        }

                        if (self.bookmarkData !== undefined) {
                            if ('added' === response.action) {
                                self.bookmarkData.posts[pid] = pid;
                            } else {
                                $.each(self.bookmarkData.posts, function (index, val) {
                                    if (pid === val) {
                                        delete self.bookmarkData.posts[index];
                                    }
                                });
                            }
                        }

                        target.removeClass('in-progress');
                        self.bookmarkProgressing = false;
                    }
                });
            });
        }

        /** remove bookmark */
        Module.removeBookmark = function () {

            var self = this;
            $('.remove-bookmark').off('click').on('click', function (e) {

                e.preventDefault();
                e.stopPropagation();

                var target = $(this);
                var pid = target.data('pid');
                var wrapper = target.parents('.p-wrap');
                var infoTemplate = $('#bookmark-remove-info');

                if (!pid || self.bookmarkProgressing) {
                    return false;
                }

                self.bookmarkProgressing = true;
                self.body.addClass('removing-bookmark');

                wrapper.fadeOut(600, function () {
                    wrapper.addClass('removing');
                    infoTemplate.fadeIn(300);
                });

                self.removeBookmarkTimeout = setTimeout(function () {
                    infoTemplate.fadeOut(600);
                    wrapper.trigger('removeBookmark', pid);
                }, 2000);

                $('#bookmark-undo').on('click', function () {
                    self.bookmarkProgressing = false;
                    self.body.removeClass('removing-bookmark');
                    wrapper.fadeIn(1000);
                    infoTemplate.fadeOut(600);
                    return false;
                });

                infoTemplate.on({
                    mouseenter: function () {
                        clearTimeout(self.removeBookmarkTimeout);
                    },
                    mouseleave: function () {
                        self.removeBookmarkTimeout = setTimeout(function () {
                            infoTemplate.fadeOut(600);
                            wrapper.trigger('removeBookmark', pid);
                        }, 1200);
                    }
                });

                wrapper.on('removeBookmark', function (event, pid) {
                    if (self.bookmarkProgressing) {
                        $.ajax({
                            type: 'POST',
                            url: self.themeSettings.ajaxurl,
                            data: {
                                action: 'rb_bookmark',
                                pid: pid
                            },
                            success: function (response) {
                                wrapper.remove();
                                self.body.removeClass('removing-bookmark');
                                self.bookmarkProgressing = false;
                            }
                        });
                    }
                });
            })
        }

        Module.followToggle = function () {
            var self = this;
            $('.follow-trigger').off('click').on('click', function (e) {

                e.preventDefault();
                e.stopPropagation();

                var target = $(this);
                var cid = target.data('cid');
                var uid = target.data('uid');
                var infoTemplate = $('#follow-toggle-info');

                if ((!cid && !uid) || self.followProgressing) {
                    return false;
                }
                self.followProgressing = true;
                target.addClass('in-progress');
                $.ajax({
                    type: 'POST',
                    url: self.themeSettings.ajaxurl,
                    data: {
                        action: 'rb_follow',
                        cid: cid,
                        uid: uid,
                    },
                    success: function (response) {
                        response = JSON.parse(JSON.stringify(response));
                        if ('added' === response.action) {
                            if (cid) {
                                $('.follow-trigger[data-cid=' + cid + ']').css('opacity', 0).addClass('followed').animate({opacity: 1}, 250);
                            } else {
                                $('.follow-trigger[data-uid=' + uid + ']').css('opacity', 0).addClass('followed').animate({opacity: 1}, 250);
                            }
                            infoTemplate.removeClass('removed bookmark-limited');
                            infoTemplate.addClass('added');
                        } else if ('removed' === response.action) {
                            if (cid) {
                                $('.follow-trigger[data-cid=' + cid + ']').css('opacity', 0).removeClass('followed').animate({opacity: 1}, 250);
                            } else {
                                $('.follow-trigger[data-uid=' + uid + ']').css('opacity', 0).removeClass('followed').animate({opacity: 1}, 250);
                            }
                            infoTemplate.removeClass('added bookmark-limited');
                            infoTemplate.addClass('removed');
                        } else if ('limit' === response.action) {
                            infoTemplate.addClass('bookmark-limited');
                        }

                        if (infoTemplate.length) {
                            infoTemplate.fadeOut(100, function () {
                                infoTemplate.find('.bookmark-desc').html(response.description);
                                infoTemplate.fadeIn(300);
                                self.timeOut = setTimeout(function () {
                                    infoTemplate.fadeOut(600);
                                }, 2000);
                            });
                            infoTemplate.on({
                                mouseenter: function () {
                                    clearTimeout(self.timeOut);
                                },
                                mouseleave: function () {
                                    self.timeOut = setTimeout(function () {
                                        infoTemplate.fadeOut(600);
                                    }, 1200);
                                }
                            });
                        }
                        target.removeClass('in-progress');
                        self.followProgressing = false;
                    }
                });
            });
        }

        /** init ajax blocks */
        Module.initAjaxBlocks = function () {
            var self = this;
            var elements = $('.is-ajax-block');
            if (elements.length > 0) {
                elements.each(function () {
                    var block = $(this);
                    var uuid = block.attr('id');
                    if (!self.ajaxData[uuid]) {
                        self.ajaxData[uuid] = self.getBlockSettings(uuid);
                    }
                    $.ajax({
                        type: 'GET',
                        url: self.themeSettings.ajaxurl,
                        data: {
                            action: 'liveb',
                            data: self.ajaxData[uuid]
                        },
                        success: function (response) {
                            response = JSON.parse(JSON.stringify(response));
                            block.html(response).fadeIn(250);
                            block.dequeue();
                            self.reInitPagination();
                            Waypoint.refreshAll();
                        }
                    });
                })
            }
        }

        /* ================================ SITE ACCESS DETECTOR================================ */
        Module.siteAccessDetector = function () {
            var self = this;
            var detection = $('#rb-checktag');

            if (!detection.length) {
                return false;
            }

            setTimeout(function () {
                if ($('.rb-adbanner').height() < 1) {
                    self.siteAccessPopup();
                    document.addEventListener('contextmenu', event => event.preventDefault());
                }
            }, 1000);
        }

        Module.siteAccessPopup = function () {
            this.siteAccessFlag = true;

            $.magnificPopup.close();

            setTimeout(function () {
                $.magnificPopup.open({
                    type: 'inline',
                    preloader: false,
                    showCloseBtn: false,
                    closeBtnInside: false,
                    enableEscapeKey: false,
                    removalDelay: 999999,
                    closeOnBgClick: false,
                    items: {
                        src: '#rb-site-access',
                        type: 'inline'
                    },
                    mainClass: 'popup-animation site-access-popup',
                    fixedBgPos: true,
                    fixedContentPos: true,
                });
            }, 310);
        }

        Module.galleryLightbox = function () {

            $('.gallery-popup-link').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                var target = $(this);
                var data = [];
                var galleryID = target.data('gallery');
                var slideIndex = target.data('index');
                var galleries = $(galleryID).find('.gallery-el');
                galleries.each(function () {
                    data.push({
                        title: $(this).find('.image-title').html(),
                        rbgallery: $(this).html()
                    });
                });

                $.magnificPopup.open({
                    type: 'inline',
                    mainClass: 'rb-gallery-popup popup-animation',
                    closeMarkup: '<button title="%title%" class="mfp-close mfp-button"><i class="rbi rbi-close"></i></button>',
                    closeOnBgClick: false,
                    removalDelay: 500,
                    showCloseBtn: true,
                    fixedBgPos: true,
                    fixedContentPos: true,
                    preloader: false,
                    gallery: {
                        enabled: true,
                        preload: [0, 2],
                        arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-button mfp-arrow-%dir%"><i class="rbi rbi-%dir%"></i></button>',
                        tCounter: '<span>%curr% / %total%</span>'
                    },
                    callbacks: {
                        open: function () {
                            $.magnificPopup.instance.goTo(slideIndex);
                        },
                        close: function () {
                            $.magnificPopup.instance.popupsCache = {};
                        },
                        buildControls: function () {
                            if (this.arrowLeft && this.arrowRight) {
                                this.contentContainer.find('.gallery-popup-nav').append(this.arrowLeft.add(this.arrowRight));
                            }
                        }
                    },
                    inline: {
                        markup: '<div class="gallery-popup-header light-scheme">' +
                            '<span class="mfp-title h5"></span>' +
                            '<div class="popup-header-right"><div class="mfp-counter"></div><div class="mfp-close"></div></div>' +
                            '</div><div class="gallery-popup-nav"></div>' +
                            '<div class="gallery-popup-content"><div class="mfp-rbgallery"></div></div>'
                    },
                    items: data
                });

                return false;
            });
        };

        Module.singleFeaturedLightbox = function () {
            $('.featured-lightbox-trigger').on('click', function (e) {

                e.preventDefault();
                e.stopPropagation();

                var source = '<img src="' + $(this).data('source') + '" alt="' + $(this).find('img').attr('alt') + '">';
                var caption = $(this).data('caption');
                var attribution = $(this).data('attribution');

                $.magnificPopup.open({
                    mainClass: 'rb-gallery-popup single-featured-popup popup-animation',
                    closeOnBgClick: true,
                    removalDelay: 500,
                    showCloseBtn: true,
                    fixedBgPos: true,
                    fixedContentPos: true,
                    preloader: false,
                    closeMarkup: '<button title="%title%" class="mfp-close mfp-button"><i class="rbi rbi-close"></i></button>',
                    callbacks: {
                        close: function () {
                            $.magnificPopup.instance.popupsCache = {};
                        },
                    },
                    inline: {
                        markup: '<div class="gallery-popup-header light-scheme">' +
                            '<div class="mfp-close"></div>' +
                            '</div><div class="gallery-popup-nav"></div>' +
                            '<div class="gallery-popup-content"><div class="mfp-source gallery-popup-image"></div>' +
                            '<div class="gallery-popup-entry light-scheme">' +
                            '<span class="mfp-title h5"></span><span class="mfp-attribution description-text"></span>' +
                            '</div>' +
                            '</div>'
                    },
                    items: {
                        title: caption,
                        source: source,
                        attribution: attribution
                    },
                });
            });
        }

        /* Ajax pagination */
        Module.paginationNextPrev = function () {
            var self = this;
            $('.pagination-trigger').off('click').on('click', function (e) {

                e.preventDefault();
                e.stopPropagation();
                var paginationTrigger = $(this);
                if (paginationTrigger.hasClass('is-disable')) {
                    return;
                }

                var block = paginationTrigger.parents('.block-wrap');
                var uuid = block.attr('id');

                if (!self.ajaxData[uuid]) {
                    self.ajaxData[uuid] = self.getBlockSettings(uuid);
                }
                if (self.ajaxData[uuid] && self.ajaxData[uuid].processing) {
                    return;
                }
                self.ajaxData[uuid].processing = true;
                var type = paginationTrigger.data('type');
                self.ajaxStartAnimation(block, 'replace');
                self.ajaxReplaceLoad(block, uuid, type);
            });
        }

        Module.ajaxReplaceLoad = function (block, uuid, type) {

            var self = this;

            if (!self.ajaxData[uuid].paged) {
                self.ajaxData[uuid].paged = 1;
            }
            if ('prev' === type) {
                self.ajaxData[uuid].page_next = parseInt(self.ajaxData[uuid].paged) - 1;
            } else {
                self.ajaxData[uuid].page_next = parseInt(self.ajaxData[uuid].paged) + 1;
            }

            var cacheID = self.cacheData.getCacheID(uuid, self.ajaxData[uuid].page_next);

            /** use cache */
            if (self.cacheData.exist(cacheID)) {
                var cache = self.cacheData.get(cacheID);
                if ('undefined' !== typeof cache.paged) {
                    self.ajaxData[uuid].paged = cache.paged;
                }
                setTimeout(function () {
                    self.ajaxRenderHTML(block, uuid, cache, 'replace');
                }, 250)

            } else {
                /** POST AJAX */
                $.ajax({
                    type: 'GET',
                    url: self.themeSettings.ajaxurl,
                    data: {
                        action: 'livep',
                        data: self.ajaxData[uuid]
                    },
                    success: function (response) {
                        response = JSON.parse(JSON.stringify(response));
                        if ('undefined' !== typeof response.paged) {
                            self.ajaxData[uuid].paged = response.paged;
                        }
                        self.cacheData.set(cacheID, response);
                        self.ajaxRenderHTML(block, uuid, response, 'replace');
                    }
                });
            }
        }

        Module.paginationLoadMore = function () {
            var self = this;
            $('.loadmore-trigger').off('click').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                var paginationTrigger = $(this);
                if (paginationTrigger.hasClass('is-disable')) {
                    return;
                }
                var block = paginationTrigger.parents('.block-wrap');
                var uuid = block.attr('id');

                if (!self.ajaxData[uuid]) {
                    self.ajaxData[uuid] = self.getBlockSettings(uuid);
                }
                if (self.ajaxData[uuid] && self.ajaxData[uuid].processing) {
                    return;
                }
                self.ajaxData[uuid].processing = true;
                self.ajaxStartAnimation(block, 'append');
                self.ajaxAppendLoad(block, uuid);
            })
        }

        Module.paginationInfinite = function () {
            var self = this;
            var infiniteElements = $('.pagination-infinite');
            if (infiniteElements.length > 0) {
                infiniteElements.each(function () {
                    var paginationTrigger = $(this);
                    if (!paginationTrigger.hasClass('is-disable')) {
                        var block = paginationTrigger.parents('.block-wrap');
                        if (block.hasClass('is-horizontal-scroll') && window.outerWidth < 1024) {
                            paginationTrigger.addClass('is-disable');
                            return;
                        }
                        var uuid = block.attr('id');
                        var wPointID = 'infinite' + uuid;
                        if (!self.ajaxData[uuid]) {
                            self.ajaxData[uuid] = self.getBlockSettings(uuid);
                        }
                        var params = {
                            element: paginationTrigger,
                            offset: 'bottom-in-view',
                            handler: function (direction) {
                                if (self.ajaxData[uuid] && self.ajaxData[uuid].processing) {
                                    return;
                                }
                                if ('down' == direction) {
                                    self.ajaxData[uuid].processing = true;
                                    self.ajaxStartAnimation(block, 'append');
                                    self.ajaxAppendLoad(block, uuid);
                                }
                            }
                        }

                        if ('uid_notification' === uuid) {
                            params.context = block.parents('.scroll-holder').eq(0);
                            if (window.outerWidth < 1025) {
                                return;
                            }
                        }
                        self.wPoint[wPointID] = new Waypoint(params);
                    }
                });
            }
        }

        Module.ajaxAppendLoad = function (block, uuid) {
            var self = this;
            if (!self.ajaxData[uuid].paged) {
                self.ajaxData[uuid].paged = 1;
            }
            if (self.ajaxData[uuid].paged >= self.ajaxData[uuid].page_max) {
                return;
            }
            self.ajaxData[uuid].page_next = parseInt(self.ajaxData[uuid].paged) + 1;
            $.ajax({
                type: 'GET',
                url: self.themeSettings.ajaxurl,
                data: {
                    action: 'livep',
                    data: self.ajaxData[uuid]
                },
                success: function (response) {
                    response = JSON.parse(JSON.stringify(response));
                    if ('undefined' !== typeof response.paged) {
                        self.ajaxData[uuid].paged = response.paged;
                    }
                    if ('undefined' !== typeof response.notice) {
                        response.content = response.content + response.notice;
                    }
                    self.ajaxRenderHTML(block, uuid, response, 'append');
                }
            });
        }

        /** live search */
        Module.liveSearch = function () {

            var liveSearch = $('.live-search-form');
            if (liveSearch.length == 0) {
                return;
            }
            var self = this;
            liveSearch.each(function () {
                var liveSearchEl = $(this);
                var input = liveSearchEl.find('input[type="text"]');
                var responseWrap = liveSearchEl.find('.live-search-response');
                var animation = liveSearchEl.find('.live-search-animation');
                input.attr('autocomplete', 'off');

                var delay = (function () {
                    var timer = 0;
                    return function (callback, ms) {
                        clearTimeout(timer);
                        timer = setTimeout(callback, ms);
                    };
                })();

                input.keyup(function () {
                    var param = $(this).val();
                    delay(function () {
                        if (param) {
                            liveSearchEl.addClass('search-loading');
                            setTimeout(function () {
                                animation.fadeIn(200);
                            }, 250);

                            $.ajax({
                                type: 'GET',
                                url: self.themeSettings.ajaxurl,
                                data: {
                                    action: 'live_search',
                                    s: param
                                },
                                success: function (data) {
                                    data = $.parseJSON(JSON.stringify(data));
                                    animation.fadeOut(200);
                                    setTimeout(function () {
                                        liveSearchEl.removeClass('search-loading');
                                    }, 250);
                                    responseWrap.hide().empty().css('height', responseWrap.height());
                                    responseWrap.html(data);
                                    responseWrap.css('height', 'auto').fadeIn(250);
                                }
                            });
                        } else {
                            responseWrap.fadeOut(250, function () {
                                responseWrap.empty().css('height', 'auto');
                            });
                        }
                    }, 250);
                })
            });
        }

        /** register cache object */
        Module.cacheData = {

            data: {},
            get: function (id) {
                return this.data[id];
            },

            set: function (id, data) {
                this.remove(id);
                this.data[id] = data;
            },

            remove: function (id) {
                delete this.data[id];
            },

            getCacheID: function (blockID, currentPage) {
                return JSON.stringify('RB_' + blockID + '_' + currentPage);
            },

            exist: function (id) {
                return this.data.hasOwnProperty(id) && this.data[id] !== null;
            }
        }

        /**
         * ajax start animation
         * @param block
         * @param action
         */
        Module.ajaxStartAnimation = function (block, action) {

            var inner = block.find('.block-inner');
            block.find('.pagination-trigger').addClass('is-disable');
            inner.stop();

            if ('replace' === action) {
                inner.css('min-height', inner.outerHeight());
                inner.fadeTo('250', 0.05);
                inner.after('<i class="rb-loader loader-absolute"></i>');
            } else {
                block.find('.loadmore-trigger').addClass('loading');
                block.find('.rb-loader').css({'display': 'block'}).delay(250).animate({opacity: 1}, 250);
            }
        }

        /**
         * render ajax
         * @param block
         * @param uuid
         * @param response
         * @param action
         */
        Module.ajaxRenderHTML = function (block, uuid, response, action) {

            var self = this;
            block.delay(50).queue(function () {
                var uuid = block.attr('id');
                var inner = block.find('.block-inner');
                block.find('.pagination-trigger').removeClass('is-disable');
                inner.stop();

                if ('replace' === action) {
                    inner.html(response.content);
                    block.find('.rb-loader').animate({opacity: 0}, 250, function () {
                        $(this).remove();
                    })
                    inner.css('min-height', '');
                    inner.fadeTo(250, 1);

                } else {
                    var content = $(response.content);
                    inner.append(content);
                    content.addClass('is-invisible');
                    content.addClass('opacity-animate');

                    block.find('.rb-loader').animate({opacity: 0}, 250, function () {
                        $(this).css({'display': 'none'});
                    });
                    setTimeout(function () {
                        content.removeClass('is-invisible');
                    }, 250);
                    block.find('.loadmore-trigger').removeClass('loading');
                }

                /** reload */
                self.ajaxTriggerState(block, uuid);
                self.ajaxData[uuid].processing = false;
                block.dequeue();
                self.reInitPagination();
                Waypoint.refreshAll();
            });
        }

        /**
         * set
         * @param block
         * @param uuid
         */
        Module.ajaxTriggerState = function (block, uuid) {
            var self = this;
            block.find('.pagination-trigger').removeClass('is-disable');
            if (self.ajaxData[uuid].paged < 2) {
                block.find('[data-type="prev"]').addClass('is-disable');
            } else if (self.ajaxData[uuid].paged >= self.ajaxData[uuid].page_max) {
                block.find('[data-type="next"]').addClass('is-disable');
                block.find('.loadmore-trigger').addClass('is-disable').hide();
                block.find('.pagination-infinite').addClass('is-disable').hide();
            }
        }

        /**
         * get block settings
         * @param uuid
         * @returns {string|*}
         */
        Module.getBlockSettings = function (uuid) {
            var settings;
            if ('undefined' !== typeof window[uuid]) {
                settings = window[uuid];
            }
            return this.cleanNull(settings);
        }

        /**
         * remove empty values
         * @param data
         * @returns {string|*}
         */
        Module.cleanNull = function (data) {
            if ('string' == typeof data) {
                return data;
            }
            $.each(data, function (key, value) {
                if (value === '' || value === null) {
                    delete data[key];
                }
            });

            return data;
        }

        /* ================================ SINGLE INFINITE ================================ */
        Module.singleInfiniteLoadNext = function () {

            var infiniteWrapper = $('#single-post-infinite');
            if (!infiniteWrapper.length) {
                return;
            }
            var self = this;
            var infiniteLoadPoint = $('#single-infinite-point');
            var animationIcon = infiniteLoadPoint.find('.rb-loader');
            var loadNexParam = {
                element: infiniteLoadPoint,
                offset: 'bottom-in-view',
                handler: function (direction) {
                    if (true === self.ajaxData['singleProcessing'] || 'up' == direction) {
                        return;
                    }
                    var nextPostURL = infiniteWrapper.data('nextposturl');
                    if (nextPostURL.indexOf('?') != -1 || nextPostURL.indexOf('#') != -1) {
                        nextPostURL = nextPostURL + '&rbsnp=1';
                    } else {
                        nextPostURL = nextPostURL + '?rbsnp=1';
                    }
                    self.ajaxData['singleProcessing'] = true;
                    animationIcon.css({'display': 'block'}).animate({opacity: 1}, 250);
                    $.ajax({
                        type: 'GET',
                        url: nextPostURL,
                        dataType: 'html',
                        success: function (response) {
                            response = $.parseJSON(JSON.stringify(response));
                            response = $('<div id="temp-dom"></div>').append($.parseHTML(response));
                            response = response.find('.single-post-outer');
                            var nextPostURL = response.data('nextposturl');
                            if ('undefined' !== typeof (nextPostURL) && nextPostURL.length > 0) {
                                infiniteWrapper.data('nextposturl', nextPostURL);
                            } else {
                                infiniteWrapper.removeAttr('id');
                                infiniteLoadPoint.remove();
                            }
                            animationIcon.animate({opacity: 0}, 250).delay(250).css({'display': 'none'});
                            infiniteWrapper.append(response);
                            self.ajaxData['singleProcessing'] = false;
                            setTimeout(function () {
                                Waypoint.refreshAll();
                                self.reInitAll();
                                if ('undefined' !== typeof FOXIZ_CORE_SCRIPT) {
                                    FOXIZ_CORE_SCRIPT.loadGoogleAds(response);
                                    FOXIZ_CORE_SCRIPT.loadInstagram(response);
                                }
                            }, 1);
                        }
                    });
                }
            }

            self.wPoint['ajaxSingleNextPosts'] = new Waypoint(loadNexParam);
        };

        Module.singleScrollRefresh = function () {
            var infiniteWrapper = $('#single-post-infinite');
            if (!infiniteWrapper.length) {
                return;
            }
            var self = this;
            self.articleData = [];
            var articleOuter = infiniteWrapper.find('.single-post-outer');
            if (articleOuter.length > 0) {
                self.inviewPostID = articleOuter.eq(0).data('postid');
                articleOuter.each(function () {
                    var article = $(this);
                    var itemData = {
                        postID: article.data('postid'),
                        postURL: article.data('postlink'),
                        postTitle: article.find('h1.s-title').text(),
                        shareList: article.find('.sticky-share-list-buffer').html(),
                        top: article.offset().top,
                        bottom: article.offset().top + article.outerHeight(true)
                    };
                    if (self.readIndicator.length > 0) {
                        var content = article.find('div[itemprop="articleBody"]');
                        content = content.eq(0);
                        itemData.indicatorTop = content.offset().top;
                        itemData.indicatorHeight = content.outerHeight(true) - self.window.height();
                    }
                    self.articleData.push(itemData);
                });
                if (window.addEventListener) {
                    window.addEventListener('scroll', function () {
                        self.animationFrame(self.scrollToUpdateArticle.bind(self));
                    }, false);
                }
            }
        }

        /** scrollToUpdateArticle */
        Module.scrollToUpdateArticle = function () {
            var self = this;
            var scroll = self.window.scrollTop();
            self.articleData.every(function (article) {
                if (scroll > (article.top + 5) && scroll < (article.bottom - 5)) {
                    if (article.indicatorTop) {
                        self.readIndicatorPercent = ((scroll - article.indicatorTop) / article.indicatorHeight) * 100;
                        if (self.readIndicatorPercent <= 130) {
                            self.readIndicator.css('width', self.readIndicatorPercent + '%');
                        }
                    }
                    if (article.postID != self.inviewPostID) {
                        self.inviewPostID = article.postID;
                        if (article.postURL !== '') {
                            history.replaceState(null, null, article.postURL);
                        }
                        document.title = article.postTitle;
                        $('.single-post-outer').removeClass('activated');
                        $('[data-postid="' + article.postID + '"]').addClass('activated');
                        $('#s-title-sticky .sticky-title').hide().html(article.postTitle).fadeIn(300);
                        $('#s-title-sticky .sticky-share-list').html(article.shareList);
                        self.body.find('.floating-video').removeClass('floating-activated');

                        if ('undefined' !== typeof FOXIZ_CORE_SCRIPT) {
                            FOXIZ_CORE_SCRIPT.updateGA(article);
                        }
                    }
                    return false;
                }
                return true;
            });
        }

        /** productQuantity */
        Module.productQuantity = function () {
            this.document.on('click', '.quantity .quantity-btn', function (e) {
                e.preventDefault();
                var button = $(this);
                var step = 1;
                var input = button.parent().find('input');
                var min = 1;
                var max = 9999;
                var value_old = parseInt(input.val());
                var value_new = parseInt(input.val());

                if (input.attr('step')) {
                    step = parseInt(input.attr('step'));
                }

                if (input.attr('min')) {
                    min = parseInt(input.attr('min'));
                }

                if (input.attr('max')) {
                    max = parseInt(input.attr('max'));
                }

                if (button.hasClass('up')) {
                    if (value_old < max) {
                        value_new = value_old + step;
                    } else {
                        value_new = 1;
                    }
                } else if (button.hasClass('down')) {
                    if (value_old > min) {
                        value_new = value_old - step;
                    } else {
                        value_new = 0;
                    }
                }

                if (!input.attr('disabled')) {
                    input.val(value_new).change();
                }
            });
        }

        Module.cartNotification = function () {
            var self = this;
            var element = $('#add-cart-popup');
            self.body.on('added_to_cart', function () {
                element.fadeIn(200);
                self.cartNotificationTimeOut = setTimeout(function () {
                    element.fadeOut(200);
                }, 5000);
                self.hoveringNotification(element);

            });
        }

        Module.hoveringNotification = function (element) {
            var self = this;

            element.on('mouseenter', function () {
                clearTimeout(self.cartNotificationTimeOut);
            });

            element.on('mouseleave', function () {
                setTimeout(function () {
                    element.fadeOut(200);
                }, 1500);
            });
        }

        return Module;

    }(FOXIZ_MAIN_SCRIPTS || {}, jQuery)
)

/** init */
jQuery(document).ready(function ($) {
    FOXIZ_MAIN_SCRIPTS.init();
});

/** Elementor editor */
jQuery(window).on('elementor/frontend/init', function () {
    FOXIZ_MAIN_SCRIPTS.isElementorEditor = true;
    FOXIZ_MAIN_SCRIPTS.editorDarkModeInit = false;

    if (window.elementor && window.elementorFrontend) {
        elementorFrontend.hooks.addAction('frontend/element_ready/widget', FOXIZ_MAIN_SCRIPTS.initElementor);
    }
});