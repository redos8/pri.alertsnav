'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Navigation Class for PRI Alerts
 * @author Yuriy Petrov at Haymarket Media
 */

var AlertsNav = function () {
	function AlertsNav() {
		var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		_classCallCheck(this, AlertsNav);

		// Options
		this.$scroller = options.$scroller || $(window);
		this.scrollOffsetY = options.scrollOffsetY || 64;
		this.scrollDuration = options.scrollDuration || 300;
		this.classMenuActive = options.classMenuActive || 'active';
		this.classProgressItem = options.classProgressItem || 'sub-nav__progress';
		this.containerHeight = options.containerHeight || $(window).height();

		// System vars
		this.states = { activeMenu: -1, activeSubMenu: -1, subPercent: 0 };
		this.navItemsPos = [];
		this.baseProgressWidth = 0;
		this.scrollOffsetMenu = 0;
		this.navItemsWidth = [];
		this.events = {};

		this.init();
	}

	_createClass(AlertsNav, [{
		key: 'init',
		value: function init() {
			// Bind events here
			this.$scroller.on('scroll', this.onScroll.bind(this));
			$('[data-nav]').on('click', this.scrollTo.bind(this));
			$(window).on('resize.AlertsNav', _.debounce(this.readNavElements.bind(this, false), 300));

			this.scrollEndUpdate = _.debounce(this.update.bind(this, true), 200);
			this.touchFirstUpdate = _.after(3, _.once(this.readNavElements.bind(this, true))); // this fixing a lot of bugs
			$('.' + this.classProgressItem).css({ width: '100%', transform: 'translateX(-100%)' });
			$('.sub-nav__item').css({ display: 'block', float: 'left' });

			this.readNavElements(false);
		}
	}, {
		key: 'on',
		value: function on(event, cb) {
			this.events[event] = cb;
		}
	}, {
		key: 'onScroll',
		value: function onScroll(e) {
			this.touchFirstUpdate();
			this.update(false);
		}

		/**
   * Reading offset's of menu elements
   */

	}, {
		key: 'readNavElements',
		value: function readNavElements() {
			var _this = this;

			var scrollBack = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

			this.navItemsPos = [];
			this.navItemsWidth = [];

			// Scroll to top when we're loaded
			// it fixing offset's bug
			if (scrollBack && !('ontouchstart' in window || navigator.msMaxTouchPoints)) {
				$(window).scrollTop(0);
			}

			// Read offset's for items of menu
			$('[data-slide]').each(function (i, item) {
				var offset = window.ScrollToPlugin ? window.ScrollToPlugin.getOffset(item, window).y | 0 : $(item).offset().top;
				if ($(item).is('[data-slide-parent]')) {
					if (Array.isArray(_this.navItemsPos[_this.navItemsPos.length - 1])) {
						_this.navItemsPos[_this.navItemsPos.length - 1].push(offset);
					} else {
						_this.navItemsPos.push([offset]);
					}
				} else {
					_this.navItemsPos.push(offset - _this.scrollOffsetY);
				}
			});

			// Read other offset's
			this.scrollOffsetMenu = $('.' + this.classProgressItem).parent().height();
			this.baseProgressWidth = $('.sub-nav__wrapper').width();

			// Read widths of every element menu
			$('.sub-nav__wrapper').each(function (i, wrapper) {
				_this.navItemsWidth[i] = [];
				$('.sub-nav__item', wrapper).each(function (z, item) {
					_this.navItemsWidth[i].push($(item).innerWidth());
				});
			});

			// Touch the update
			this.update();
		}

		/**
   * Update the navigation menu by scrolling
   * @param {boolean} [debounced]
   */

	}, {
		key: 'update',
		value: function update() {
			var _this2 = this;

			var debounced = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

			var activeIndex = -1;
			var activeSubIndex = -1;
			var baseProgressWidth = 0;
			var stepOffset = this.scrollOffsetMenu + this.scrollOffsetY;
			var position = this.$scroller.scrollTop() + stepOffset;

			// Finding what is active slide by scroll position
			this.navItemsPos.forEach(function (el, i) {
				if (Array.isArray(el)) {
					// if we got an array it means that it's values of submenu
					el.forEach(function (sEl, z) {
						if (position >= sEl) {
							// Fill base width of progressbar by active item of menu
							z != 0 && (baseProgressWidth += _this2.navItemsWidth[0][z - 1] / _this2.baseProgressWidth);
							activeSubIndex = z;
							activeIndex = i;
						}
					});
				} else {
					if (position >= el) {
						activeIndex = i;
						activeSubIndex = -1;
					}
				}
			});

			// Set state activity of menu when it changes
			//
			// Main level
			if (this.states.activeMenu != activeIndex) {
				$('.nav-menu [data-nav]').removeClass(this.classMenuActive);
				if (activeIndex !== -1) {
					$('.nav-menu [data-nav]').eq(activeIndex).addClass(this.classMenuActive);
				}

				if (activeSubIndex !== -1) {
					$('.sub-nav').addClass(this.classMenuActive);
				} else {
					$('.sub-nav').removeClass(this.classMenuActive);
				}

				this.events['change:menu'] && this.events['change:menu'](activeIndex);
				this.states.activeMenu = activeIndex;
			}

			// Sub level
			if (this.states.activeSubMenu != activeSubIndex) {
				$('.sub-nav [data-nav]').removeClass(this.classMenuActive);
				if (activeSubIndex !== -1) {
					$('.sub-nav [data-nav]').eq(activeSubIndex).addClass(this.classMenuActive);
				}

				this.events['change:submenu'] && this.events['change:submenu'](activeSubIndex);
				this.states.activeSubMenu = activeSubIndex;
			}

			// If we are within SubLevel then show the progress
			if (activeSubIndex !== -1) {
				var startOffset = this.navItemsPos[activeIndex][0];
				var currentOffset = this.navItemsPos[activeIndex][activeSubIndex] - startOffset;
				var nextOffset = (this.navItemsPos[activeIndex][activeSubIndex + 1] || this.navItemsPos[activeIndex + 1] || $('body').prop('scrollHeight') - this.containerHeight) - startOffset;

				var positionOffset = position - startOffset;

				var stepCurrentOffset = positionOffset - currentOffset;
				var stepNextOffset = nextOffset - currentOffset;
				// let perSubItem = 1 / this.navItemsPos[activeIndex].length;
				var percent = baseProgressWidth;

				// Push percent between current and next menu item
				percent += stepCurrentOffset / stepNextOffset * (this.navItemsWidth[0][activeSubIndex] / this.baseProgressWidth);

				percent = 1 - percent; // reversing

				this.states.subPercent = percent;

				this.updateProgress(percent);
			}

			if (!debounced) {
				this.scrollEndUpdate();
			}
		}

		/**
   * Update View of progressbar
   * @param {number} percent [0-1]
   */

	}, {
		key: 'updateProgress',
		value: function updateProgress(percent) {
			percent = percent < 0 ? 0 : percent;
			percent = percent > 1 ? 1 : percent;
			$('.' + this.classProgressItem).css('transform', 'translateX(' + -(percent * 100) + '%)');
		}

		/**
   * Do scroll to element or position
   * @param {MouseEvent} e
   */

	}, {
		key: 'scrollTo',
		value: function scrollTo(e) {
			// Convert data attribute 'slide-1' to number and pick element by index
			var index = parseInt(String($(e.currentTarget).data('nav')).match(/slide\-([0-9]+)/)[1]);
			var lineArray = _.flatten(this.navItemsPos);

			if (typeof TweenMax !== 'undefined') {
				TweenMax.to(window, 100 / this.scrollDuration, {
					scrollTo: {
						y: lineArray[index],
						offsetY: this.scrollOffsetY + this.scrollOffsetMenu,
						autoKill: false
					}
				});
			} else {
				this.$scroller.animate({ scrollTop: $to.offset().top - this.scrollOffsetY + this.scrollOffsetMenu }, this.scrollDuration);
			}
		}
	}]);

	return AlertsNav;
}();
