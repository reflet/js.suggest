(function($){
    /**
     * 初期値
     */
    var defaults = {};

    /**
     * サジェスト機能
     *
     * @class suggest
     * @constructor
     * @param     {Element} elem
     * @param     {Object}  option
     */
    var Suggest = function(elem , option) {
        var self = this, is_submit = false;
        self.opt = $.extend({}, defaults, option);
        self.list = $('<ul>', {id: 'suggest-list', style: 'display:none'});
        self.text = $(elem)
            .attr('autocomplete', 'off')
            .after(self.list)
            .blur(function(){
                setTimeout(function() {
                    self.hideList();
                }, 250);
            })
            .keydown(function(e){
                var code = e.keyCode ? e.keyCode : e.which;
                switch (code) {
                    // ENTER
                    case 13:
                        // is_submit: ブラウザ対策 -> IMEのENTERの挙動が異なる
                        is_submit = true;
                        if (self.statusList() === 'show') {
                            self.hideList();
                            self.text[0].form.submit();
                            return false;
                        }
                        break;
                    default:
                        is_submit = false;
                        break;
                }
            })
            .keyup(function(e){
                var code = e.keyCode ? e.keyCode : e.which,
                    val  = $(this).val();
                switch (code) {
                    // ESC
                    case 27:
                        self.hideList();
                        break;
                    // 上矢印 (↑)
                    case 38:
                        if (val && self.statusList() === 'show') {
                            self.setFocus(-1);
                        }
                        break;
                    // 下矢印 (↓)
                    case 40:
                        if (val && self.statusList() === 'show') {
                            self.setFocus(1);
                        } else {
                            self.showList();
                        }
                        break;
                    // その他 (※ENTERを含む: firefox -> 日本語入力の場合、すべてENTERになる)
                    default:
                        if (val && is_submit !== true) {
                            self.halt()
                                .request(val, function(data) {
                                    self.setList(data)
                                        .showList();
                                });
                        } else {
                            self.hideList();
                        }
                        break;
                }
            });
    };
    $.extend(Suggest.prototype, {
        /**
         * タイムアウトID
         * @type    {number}
         */
        tid: null,

        /**
         * インデックス番号（フォーカス）
         * @type    {number}
         */
        focus: null,

        /**
         * 要素： 検索BOX (input)
         * @type    {Element}
         */
        text: null,

        /**
         * 要素： 検索候補のリスト (ul)
         * @type    {Element}
         */
        list: null,

        /**
         * 要素： 検索候補の一覧 (li)
         * @type    {Array.<Element>}
         */
        words : [],

        /**
         * リクエスト
         *
         * @method  request
         * @param   {String}   val
         * @param   {Function} callback
         * @return  this
         */
        request : function (val, callback) {
            this.setFocus(null);
            this.tid = setTimeout(function(){
                $.ajax({
                    url     : 'http://www.google.com/complete/search',
                    type    : 'GET',
                    data    : {hl:'ja', client:'firefox', q: val},
                    dataType: 'jsonp',
                    success :function(data) {
                        callback(data[1]);
                        this.tid = null;
                    }
                });
            }, 500);
            return this;
        },

        /**
         * リクエスト処理を中断する
         * @method  stopRequest
         * @return  this
         */
        halt: function () {
            if (this.tid) clearTimeout(this.tid);
            return this;
        },

        /**
         * 検索候補一覧をセットする
         *
         * @method  setList
         * @param   {Array.<number>}   data
         * @return  this
         */
        setList : function (data) {
            var self = this;
            self.list.text('');
            if (data.length) {
                for (var i = 0; i < data.length; ++i) {
                    self.list.append(self.createElement(data[i]));
                }
                self.words = $('li', self.list);
            }else{
                self.words = [];
                this.list.hide();
            }
            return this;
        },

        /**
         * 検索候補一覧を表示する
         *
         * @method  showList
         * @return  this
         */
        showList : function () {
            if (this.text.val() && this.words.length > 0) {
                this.list.show();
            }
            return this;
        },

        /**
         * 検索候補一覧を非表示にする
         *
         * @method  hideList
         * @return  this
         */
        hideList : function () {
            this.halt()
                .list.hide();
            return this;
        },

        /**
         * 検索候補一覧の状態を返す
         *
         * @method  hideList
         * @return  {String}    show: 表示中, hide: 非表示
         */
        statusList :function () {
            return (this.list.is(":visible")) ? 'show' : 'hide';
        },

        /**
         * li要素を作成する
         *
         * @method  create
         * @param   {String}   val
         * @return  {Element}
         */
        createElement: function(val) {
            var self = this;
            return $('<li>').text(val)
                .click(function(){
                    self.text[0].form.submit();
                })
                .focus(function(){
                    self.words.blur();
                    self.text.val($(this).text());
                    $(this).addClass('over');
                })
                .mouseover(function(){
                    $(this).focus();
                })
                .blur(function(){
                    $(this).removeClass('over');
                })
                .mouseout(function(){
                    $(this).blur();
                });
        },

        /**
         * フォーカスをセットする
         *
         * @method  setFocus
         * @param   {number}   val
         * @return  this
         */
        setFocus: function (val) {
            if (typeof val === 'undefined') {
                // no action...
            } else if (val === null) {
                this.focus = null;
            } else if (typeof val === 'number') {
                var index = this.getIndex(val);
                if (this.focus !== index) {
                    this.words.eq(index).focus();
                    this.focus = index;
                }
            }
            return this;
        },

        /**
         * 指定のインデックスを取得する
         *
         * @method  getIndex
         * @param   {number}    val
         * @return  {number}    インデックス番号
         */
        getIndex: function (val) {
            var min = 0, max = this.words.length - 1,
                num = (typeof val === 'number') ? val : 0,
                index = (!this.focus && this.focus !== 0) ? 0 : this.focus + num;
            if (index < min) index = min;
            if (index > max) index = max;
            return index;
        }
    });
    $.fn.suggest = function(option) {
        return this.each(function() {
            new Suggest(this, option);
        });
    };
}(jQuery));