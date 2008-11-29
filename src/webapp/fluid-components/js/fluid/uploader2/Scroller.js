/*
Copyright 2007-2008 University of California, Berkeley
Copyright 2007-2008 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

/*global jQuery*/
/*global fluid_0_6*/

fluid_0_6 = fluid_0_6 || {};

(function ($, fluid) {
    
	var refreshView = function (that) {
		var maxHeight = that.options.maxHeight;
		var isOverMaxHeight = (that.scrollingElm.children().eq(0).height() > maxHeight);
		var setHeight = (isOverMaxHeight) ? maxHeight : "";
		that.scrollingElm.height(setHeight);
    };
    
    var scrollBottom = function (that) {
        that.scrollingElm[0].scrollTop = that.scrollingElm[0].scrollHeight;
    };
    
    var scrollTo = function (that, element) {
        if (!element || element.length < 1) {
            return;
        }
        
        var padTop = 0;
        var padBottom = 0;
        
        var elmPosTop = element[0].offsetTop;
        var elmHeight = element.height();
        var containerScrollTop = that.scrollingElm[0].scrollTop;
        var containerHeight = that.scrollingElm.height();
        
        if (that.options.padScroll) {
            // if the combined height of the elements is greater than the 
            // viewport then then scrollTo element would not be in view
            var prevElmHeight = element.prev().height();
            padTop = (prevElmHeight + elmHeight <= containerHeight) ? prevElmHeight : 0;
            var nextElmHeight = element.next().height();
            padBottom =  (nextElmHeight + elmHeight <= containerHeight) ? nextElmHeight : 0;
        }
        
        // if the top of the row is ABOVE the view port move the row into position
        if ((elmPosTop - padTop) < containerScrollTop) {
            that.scrollingElm[0].scrollTop = elmPosTop - padTop;
        }
        
        // if the bottom of the row is BELOW the viewport then scroll it into position
        if (((elmPosTop + elmHeight) + padBottom) > (containerScrollTop + containerHeight)) {
            elmHeight = (elmHeight < containerHeight) ? elmHeight : containerHeight;
            that.scrollingElm[0].scrollTop = (elmPosTop - containerHeight + elmHeight + padBottom);
        }
    };
    
    var setupScroller = function (that) {
        that.scrollingElm = that.container.parents(that.options.selectors.wrapper);
        
        // We should render our own sensible default if the scrolling element is missing.
        if (!that.scrollingElm.length) {
			fluid.fail({
                name: "Missing Scroller",
                message: "The scroller wrapper element was not found."
            });
        }
		
		// set the height of the scroller unless this is IE6
		if (!$.browser.msie || $.browser.version > 6) {
			that.scrollingElm.css("max-height", that.options.maxHeight);
		}
    };
    
    /**
     * Creates a new Scroller component.
     * 
     * @param {Object} container the element containing the collection of things to make scrollable 
     * @param {Object} options configuration options for the component
     */
    fluid.scroller = function (container, options) {
        var that = fluid.initView("fluid.scroller", container, options);
        setupScroller(that);

        /**
         * Scrolls the specified element into view
         * 
         * @param {jQuery} element the element to scroll into view
         */
        that.scrollTo = function (element) {
            scrollTo(that, element);
        };
        
        /**
         * Scrolls to the bottom of the view.
         */
        that.scrollBottom = function () {
            scrollBottom(that);
        };
        
        /**
         * Refreshes the scroller's appearance based on any changes to the document.
         */
        that.refreshView = function () {
			if ($.browser.msie && $.browser.version < 7) {
				refreshView(that);
			}
        };
        
        that.refreshView();
        return that;
    };
    
    fluid.defaults("fluid.scroller", {  
        selectors: {
            wrapper: ".fluid-scroller"
        },
        
        maxHeight: 180,
        
        padScroll: true
    });
    
})(jQuery, fluid_0_6);
