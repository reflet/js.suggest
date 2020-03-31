	
	/*
	YSTサジェストJS
	*/

	(function($) {
		$.suggest = function(input, options, option2) {
			var clickEvent = 0;
			var sgTimeout = null;
			
			if(option2 == null){
				var $input = $(input).attr("autocomplete", "off");
				var $results = $(document.createElement("ul"));
				$results.addClass(options.resultsClass).appendTo('body');
				var timeout = false;
				var prevVal = '';
				prevVal = $input.val();
				var cache = [];
				var cacheSize = 0;
				var suggest_ev = null;
				var suggest_focus = null;
				var suggest_event = null;
				var suggest_clear = null;
			}

			clearTab(1);
			setOpt();
			resetPosition();
			$(window)
				.load(resetPosition)		// just in case user is changing size of page while loading
				.resize(resetPosition);

			$input.focus(function(){
				if($.cookie('jwd_suggest_sw') != "off"){
					clearTimeout(suggest_clear);
					if(suggest_event != null){
						suggest_event = 1;
					}
					suggest_ev = setInterval(function(){
						if($input.val() != prevVal && $.cookie('jwd_suggest_sw') != "off")	{
							suggest(0,1);
							prevVal = $input.val();
						}
					},options.delay);
				}
			});

			$input.blur(function() {
				clearInterval(suggest_ev);
				clearInterval(suggest_focus);
				suggest_clear = setTimeout(function() {
					clearTab(9);
				},options.delay);
			});

			$(input).focus();

			// help IE users if possible
			try {
				$results.bgiframe();
			} catch(e) { }

			if ($.browser.mozilla || $.browser.opera) {
				$(input).keyup(processKey2);
				$(input).keypress(processKey);
			}else{
				$(input).keydown(processKey);		// onkeydown repeats arrow keys in IE/Safari
			}

			function clearTab(num) {
				html = '<div id="jwdTabNormal" name="jwdTabNormal"><div></div></div>';
				$results.css("background","transparent");
				$results.css("border",0);
				if($.browser.msie){
					$results.css("width","344px");
					$results.css("height",(10*20+15)+"px");
				}
				$results.html(html).show();


				$("#jwdTabNormal").click(function() {
					$(input).focus();
					suggest_event = 2;
					suggest(1,2);
				});
				suggest_event = null;
			}

			function resetPosition() {
				var offset = $input.offset();
				$results.css({
					top: (offset.top + input.offsetHeight) + 'px',
					left: offset.left + 'px'
				});
			}

			function processKey(e) {
				if($.cookie('jwd_suggest_sw')!="off"){

					if ((/27$|38$|40$/.test(e.keyCode) && $results.is(':visible')) ||
						(/^13$|^9$/.test(e.keyCode) && getCurrentResult())) {
						
						if (e.preventDefault)
							e.preventDefault();
	
						if (e.stopPropagation)
							e.stopPropagation();
	
							e.cancelBubble = true;
							e.returnValue = false;
						
						switch(e.keyCode) {
		
							case 38: // up
								prevResult();
								break;
					
							case 40: // down
								nextResult();
								break;
		
							case 9:  // tab
							case 13: // return
								selectCurrentResult();
								break;
								
							case 27: //	escape
								clearTab('ESC');
								break;
		
						}
					}
				}
			}

			//Mozilla
			function processKey2(e) {
				if($.cookie('jwd_suggest_sw')!="off"){
					if ((/^13$/.test(e.keyCode) && getCurrentResult())) {
						
						if (e.preventDefault)
							e.preventDefault();
	
						if (e.stopPropagation)
							e.stopPropagation();
	
							e.cancelBubble = true;
							e.returnValue = false;
						
						switch(e.keyCode) {
							case 13: // return
								selectCurrentResult();
								break;
						}
					}					
				}
			}

			function suggest(clickEvent,num) {
				
				clearTimeout(suggest_clear);
				var q = $.trim($input.val());

				cached = checkCache(q);
				
				if (cached) {
				
					displayItems(cached['items']);
					
				} else {
					$.get(options.source, {q: q}, function(txt) {
					
						var items = parseTxt(txt, q);
						
						displayItems(items);
						addToCache(q, items, txt.length);
					});
				}				
			}
			
			function checkCache(q) {

				for (var i = 0; i < cache.length; i++)
					if (cache[i]['q'] == q) {
						cache.unshift(cache.splice(i, 1)[0]);
						return cache[0];
					}
				
				return false;
			
			}
			
			function addToCache(q, items, size) {

				while (cache.length && (cacheSize + size > options.maxCacheSize)) {
					var cached = cache.pop();
					cacheSize -= cached['size'];
				}
				
				cache.push({
					q: q,
					size: size,
					items: items
					});
					
				cacheSize += size;
			
			}
			
			function displayItems(items) {
				var html = '';
				var rows = items.length;
				if($.cookie('jwd_suggest_sw')=="off" && suggest_event == 2){
					html += '<div id="sgInfo">キーワード入力補助がOFFになっています。</div>';
					rows = 1;
				}else if (rows==0) {
					if($input.val().length == 0 && suggest_event == 2){
						html += '<div id="sgInfo">キーワードが入力されていません。</div>';
						rows = 1;
					}else if(suggest_event == 2){
						html += '<div id="sgInfo">入力したキーワードに一致する候補はありません。</div>';
						rows = 1;
					}else{
						clearTab(4);
						return;
					}
				}else{

					for (var i = 0; i < rows; i++){
						html += '<li name="ac_row">' + items[i] + '</li>';
					}
				}
				html += '<div id="jwdTabOpt">キーワード入力補助&nbsp;<span id="jwdTabOptOn">ON</span>&nbsp;−&nbsp;<span id="jwdTabOptOff">OFF</span>&nbsp;</div><div id="jwdTabActive" name="jwdTabActive"><div></div></div>';


				$results.html(html).show();

				$results.css("background","white");
				$results.css("border-left","1px solid gray");
				$results.css("border-right","1px solid gray");

				if($.browser.mozilla){
					$results.css("height",(rows*20)+15+"px");
				}else if($.browser.msie){
					$results.css("height",(rows*20)+15+"px");
					$results.css("width","344px");
				}else if($.browser.opera){
					$results.css("height",(rows*20)+15+"px");
				}else if($.browser.safari){
					$results.css("height",(rows*20)+19+"px");
				}
			
				setOpt();
				$results
					.children('li')
					.mouseover(function() {
						$results.children('li').removeClass(options.selectClass);
						$(this).addClass(options.selectClass);
					})
					.click(function(e) {
						e.preventDefault(); 
						e.stopPropagation();
						selectCurrentResult();
					});
					$("#jwdTabActive").click(function() {
						clearTab(3);
					});

					$("#jwdTabOptOn").click(function() {
						optOn();
					});	
					$("#jwdTabOptOff").click(function() {
						optOff();
					});	
			}

			function parseTxt(txt, q) {

				var items = [];
				var tokens = txt.split(options.delimiter);

				// parse returned data for non-empty items
				for (var i = 0; i < tokens.length; i++) {
					var token = $.trim(tokens[i]);
					if (token) {
						token = token.replace(
							new RegExp(q, 'ig'), 
							function(q) { return '<span class="' + options.matchClass + '">' + q + '</span>' }
							);
						items[items.length] = token;
					}
				}
				return items;
			}

			function getCurrentResult() {

				if (!$results.is(':visible'))
					return false;

				var $currentResult = $results.children('li.' + options.selectClass);

				if (!$currentResult.length)
					$currentResult = false;

				return $currentResult;

			}
			
			function selectCurrentResult() {
			
				$currentResult = getCurrentResult();
			
				if ($currentResult) {
					$input.val($currentResult.text());
					clearTab(5);
					if (options.onSelect){
						options.onSelect.apply($input[0]);
					}						
				}
			
			}
			
			function nextResult() {
			
				$currentResult = getCurrentResult();
			
				if ($currentResult)
					$currentResult
						.removeClass(options.selectClass)
						.next()
						.addClass(options.selectClass);
				else
					$results.children('li:first-child').addClass(options.selectClass);
			
			}
			
			function prevResult() {
			
				$currentResult = getCurrentResult();
			
				if ($currentResult)
					$currentResult
						.removeClass(options.selectClass)
						.prev()
							.addClass(options.selectClass);
				else
					$results.children('li:last-child').addClass(options.selectClass);
			
			}

			function optOff() {

				$.cookie('jwd_suggest_sw','off'); 
				$.cookie('jwd_suggest_sw','off', { expires: 30 });
				setOpt();
				clearTab(6);

			}

			function optOn() {
			
				$.cookie('jwd_suggest_sw','on');
				$.cookie('jwd_suggest_sw','on', { expires: 30 });
				setOpt();
				clearTab(7);
			
			}

			function setOpt() {
				if($.cookie('jwd_suggest_sw')=="off"){
					$("#jwdTabOptOff").css('color','black');
					$("#jwdTabOptOff").css('font-weight','bold');
					$("#jwdTabOptOff:hover").css('text-decoration','none');
					$("#jwdTabOptOn").css('color','#1D3994');
					$("#jwdTabOptOn").css('font-weight','normal');
					$("#jwdTabOptOn").css('text-decoration','underline');
					$("#jwdTabOptOn").css('cursor','pointer');
					$(function(){
						$("#jwdTabOptOn").hover(function(){
							$(this).css('text-decoration','underline');
						},function(){
							$(this).css('text-decoration','none');
						})
					})
					$(input).attr("autocomplete", "on");				

				}else{
					$("#jwdTabOptOn").css('color','black');
					$("#jwdTabOptOn").css('font-weight','bold');
					$("#jwdTabOptOff:hover").css('text-decoration','none');
					$("#jwdTabOptOff").css('color','#1D3994');
					$("#jwdTabOptOff").css('font-weight','normal');	
					$("#jwdTabOptOff").css('cursor','pointer');

					$(function(){
						$("#jwdTabOptOff").hover(function(){
							$(this).css('text-decoration','underline');
						},function(){
							$(this).css('text-decoration','none');
						})
					})
					$(input).attr("autocomplete", "off");
				}
			}
		}
		
		$.fn.suggest = function(source, options) {

			if (!source)
				return;

			options = options || {};
			options.source = source;
			options.delay = options.delay || 500;
			options.resultsClass = options.resultsClass || 'ac_results';
			options.resultsClassNormal = options.resultsClassNormal || 'ac_results_normal';
			options.selectClass = options.selectClass || 'ac_over';
			options.matchClass = options.matchClass || 'ac_match';
			options.minchars = 0;
			options.delimiter = options.delimiter || '\n';
			options.onSelect = options.onSelect || false;
			options.maxCacheSize = options.maxCacheSize || 65536;

			this.each(function() {
				new $.suggest(this, options);
			});
	
			return this;
			
		};
		
	})(jQuery);
	
