/**
 * Navigation Class for PRI Alerts
 * @author Yuriy Petrov at Haymarket Media
 */

class AlertsNav {
	constructor(options = {}) {

		// Options
		this.$scroller = options.$scroller || $(window);
		this.scrollOffsetY = options.scrollOffsetY || 64;
		this.scrollDuration = options.scrollDuration || 300;
		this.classMenuActive = options.classMenuActive || 'active';
		this.classProgressItem = options.classProgressItem || 'sub-nav__progress';
		this.containerHeight = options.containerHeight || $(window).height();

		// System vars
		this.states = {activeMenu: -1, activeSubMenu: -1, subPercent: 0};
		this.navItemsPos = [];
		this.baseProgressWidth = 0;
		this.scrollOffsetMenu = 0;
		this.navItemsWidth = [];
		this.events = {};

		this.init();
	}

	init() {
		// Bind events here
		this.$scroller.on('scroll', this.onScroll.bind(this));
		$('[data-nav]').on('click', this.scrollTo.bind(this));
		$(window).on('resize.AlertsNav', _.debounce(this.readNavElements.bind(this, false), 300));

		this.scrollEndUpdate = _.debounce(this.update.bind(this, true), 200);
		this.touchFirstUpdate = _.after(3, _.once(this.readNavElements.bind(this, true))); // this fixing a lot of bugs
		$('.' + this.classProgressItem).css({width: '100%', transform: 'translateX(-100%)'});
		$('.sub-nav__item').css({display: 'block', float: 'left'});

		this.readNavElements(false);
	}

	on(event, cb) {
		this.events[event] = cb;
	}

	onScroll(e) {
		this.touchFirstUpdate();
		this.update(false);
	}

	/**
	 * Reading offset's of menu elements
	 */
	readNavElements(scrollBack = false) {
		this.navItemsPos = [];
		this.navItemsWidth = [];

		// Scroll to top when we're loaded
		// it fixing offset's bug
		if(scrollBack) {
			$(window).scrollTop(0);
		}

		// Read offset's for items of menu
		$('[data-slide]').each((i, item) => {
			let offset = window.ScrollToPlugin ? (window.ScrollToPlugin.getOffset(item, window).y | 0) : $(item).offset().top;
			if ($(item).is('[data-slide-parent]')) {
				if (Array.isArray(this.navItemsPos[this.navItemsPos.length - 1])) {
					this.navItemsPos[this.navItemsPos.length - 1].push(offset);
				} else {
					this.navItemsPos.push([offset]);
				}
			} else {
				this.navItemsPos.push(offset - this.scrollOffsetY);
			}
		});

		// Read other offset's
		this.scrollOffsetMenu = $('.' + this.classProgressItem).parent().height();
		this.baseProgressWidth = $('.sub-nav__wrapper').width();

		// Read widths of every element menu
		$('.sub-nav__wrapper').each((i, wrapper) => {
			this.navItemsWidth[i] = [];
			$('.sub-nav__item', wrapper).each((z, item) => {
				this.navItemsWidth[i].push($(item).innerWidth());
			});
		});

		// Touch the update
		this.update();
	}


	/**
	 * Update the navigation menu by scrolling
	 * @param {boolean} [debounced]
	 */
	update(debounced = false) {
		let activeIndex = -1;
		let activeSubIndex = -1;
		let baseProgressWidth = 0;
		let stepOffset = this.scrollOffsetMenu + this.scrollOffsetY;
		let position = this.$scroller.scrollTop() + stepOffset;

		// Finding what is active slide by scroll position
		this.navItemsPos.forEach((el, i) => {
			if (Array.isArray(el)) { // if we got an array it means that it's values of submenu
				el.forEach((sEl, z) => {
					if (position >= sEl) {
						// Fill base width of progressbar by active item of menu
						z != 0 && (baseProgressWidth += this.navItemsWidth[0][z - 1] / this.baseProgressWidth);
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
			let startOffset = this.navItemsPos[activeIndex][0];
			let currentOffset = this.navItemsPos[activeIndex][activeSubIndex] - startOffset;
			let nextOffset = (this.navItemsPos[activeIndex][activeSubIndex + 1] || this.navItemsPos[activeIndex + 1] || ($('body').prop('scrollHeight') - this.containerHeight)) - startOffset;

			let positionOffset = position - startOffset;


			let stepCurrentOffset = positionOffset - currentOffset;
			let stepNextOffset = (nextOffset - currentOffset);
			// let perSubItem = 1 / this.navItemsPos[activeIndex].length;
			let percent = baseProgressWidth;


			// Push percent between current and next menu item
			percent += (stepCurrentOffset / stepNextOffset) * (this.navItemsWidth[0][activeSubIndex] / this.baseProgressWidth);

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
	updateProgress(percent) {
		percent = percent < 0 ? 0 : percent;
		percent = percent > 1 ? 1 : percent;
		$('.' + this.classProgressItem).css('transform', 'translateX(' + -(percent * 100) + '%)');
	}

	/**
	 * Do scroll to element or position
	 * @param {MouseEvent} e
	 */
	scrollTo(e) {
		// Convert data attribute 'slide-1' to number and pick element by index
		let index = parseInt((String($(e.currentTarget).data('nav')).match(/slide\-([0-9]+)/))[1]);
		let lineArray = _.flatten(this.navItemsPos);


		if (typeof TweenMax !== 'undefined') {
			TweenMax.to(window, 100 / this.scrollDuration, {
				scrollTo: {
					y: lineArray[index],
					offsetY: this.scrollOffsetY + this.scrollOffsetMenu,
					autoKill: false
				}
			});
		} else {
			this.$scroller.animate({scrollTop: $to.offset().top - this.scrollOffsetY + this.scrollOffsetMenu}, this.scrollDuration);
		}
	}
}
