(function() {
    var Youtube = function() {};

    Youtube.VIEW_COUNT   = 9;    // 画面に表示する件数
    Youtube.SUGGEST_TIME = 500;  // Suggestまでの時間（ミリ秒）

    Youtube.prototype = {
        searchCond : {},   // 検索条件
        tid        : null, // suggest タイマーID
        preinput   : null, // 前回の検索文字列

        // --- 新規検索 ---
        searchNew  : function(cond) {
            this.search({
                "keyword": cond.keyword,
                "page": 1,
                "orderby": "relevance",
                "fromHistory": false
            });
        },

        // --- 履歴検索 ---
        searchHistory: function(cond) {
            if ($("#history li").size() == 0) return;
            this.search($.extend({}, this.searchCond, cond, {"fromHistory": true}));
        },

        // --- 検索 ---
        search: function(cond) {
            // suggest 停止
            this.stop_suggest();

            // 検索条件の検査
            if (cond == null) return;
            if (cond.keyword == null || cond.keyword.length == 0) {
                alert("検索キーワードを入力してください。");
                return;
            }

            // 検索取得開始インデックス
            var index = (cond.page-1)*Youtube.VIEW_COUNT+1;

            // 検索条件の保存
            $.extend(this.searchCond, cond);

            // サムネイル表示を初期化
            $("#videos").text("Loading...");

            // ajax通信定義
            $.ajax({
                dataType: "jsonp",
                data: {
                    "vq": cond.keyword,
                    "orderby": cond.orderby,
                    "start-index": index,
                    "max-results": Youtube.VIEW_COUNT,
                    "alt":"json-in-script"
                },
                cache: true,
                url: "http://gdata.youtube.com/feeds/api/videos",
                success: function (data) {
                    // サムネイル表示をクリア
                    $("#videos").empty();

                    // 検索結果件数を取得・表示
                    yt.searchCond.total = parseInt(data.feed.openSearch$totalResults.$t,10);
                    yt.showTotal(index, yt.searchCond.total);

                    // 検索結果が0件
                    if (yt.searchCond.total == 0) {
                        alert("検索キーワードにマッチするビデオはありませんでした。");
                        return;
                    }

                    // エントリを参照してサムネイルを生成
                    $.each(data.feed.entry, function(i,item){
                        var group = item.media$group;

                        $("<div/>").addClass("thumbnail")
                            .append($("<img/>").attr("src", group.media$thumbnail[0].url)).append("<br/>")
                            .append(item.title.$t).append("<br/>")
                            .append($("<span/>").addClass("info").text("再生回数：" + ((item.yt$statistics == null) ? "0" : item.yt$statistics.viewCount)))
                            .click(function(){window.open(group.media$player[0].url, null)})
                            .appendTo("#videos");
                    });

                    // 検索履歴に追加
                    if (!cond.fromHistory) {
                        yt.addHistory($("#videos img:first").clone(), cond.keyword);
                    }
                }
            });
        },

        // --- 検索結果件数表示 ---
        showTotal: function(index, total) {
            $("#result").text(
                ((total == 0) ? 0 : index)
                + " - "
                + (index+Youtube.VIEW_COUNT > total ? total : index+Youtube.VIEW_COUNT-1)
                + " / "
                + total
                + "件"
            );
        },

        // --- 前へ ---
        searchPrev: function() {
            if (this.searchCond.page <= 1) return;
            this.searchHistory({"page": this.searchCond.page-1});
        },

        // --- 次へ ---
        searchNext: function() {
            if (this.searchCond.page*Youtube.VIEW_COUNT+1 > this.searchCond.total) return;
            this.searchHistory({"page": this.searchCond.page+1});
        },

        // --- 検索履歴追加 ---
        addHistory: function(img, keyword) {
            // (1) 履歴に検索キーワードが存在するか
            var exists = $.grep($("#history li"), function(item, index){
                return ($(item).children(".key").text() == keyword);
            });

            if (exists.length == 0) {    // (2) 存在しない
                $("<li/>")
                    .append(img).append("<br/>")
                    .append($("<span/>").addClass("key").append(keyword))
                    .append(
                        $("<a/>").addClass("del").append("[x]")
                        .click(function(){
                            $(this).parent().remove();
                            if (yt.searchCond.keyword == keyword) {
                                $("#videos").empty();
                                $("#result").empty();
                            }
                        })
                    )
                    .click(function(){yt.searchHistory({"keyword":keyword, "page":1, "orderby":"relevance"});})
                    .prependTo("#history > ul");
            } else {    // (3) 存在する
                $(exists)
                    .prependTo($(exists).parent())
                    .children("img").attr("src", img.attr("src"));
            }
        },

        // --- suggest実行 ---
        suggest: function(force) {
            this.stop_suggest();

            if (force) this.preinput = null;
            this.tid = setTimeout(function(){yt.do_suggest()}, Youtube.SUGGEST_TIME);
        },

        // --- suggest停止 ---
        stop_suggest: function() {
            clearTimeout(this.tid);
        },

        // --- suggest処理 ---
        do_suggest: function() {
            // Suggestが表示されていたら非表示にする。
            $("#suggest").hide();

            // 検索キーワードの処理
            var str = $("#keyword").val();
            if (str == null || str.length == 0) return;
            if (this.preinput == str) return;
            this.preinput = str;

            // ajax通信定義
            $.ajax({
                dataType: "jsonp",
                data: {
                    "vq": str,
                    "max-results": 10,  // 10件分を検索
                    "alt":"json-in-script"
                },
                cache: true,
                url: "http://gdata.youtube.com/feeds/api/videos",
                success: function (data) {
                    // 検索キーワードにマッチするデータがない
                    if (data.feed.entry == null) return;

                    var suggests = [];
                    $("#suggest").empty();  // Suggestをクリア
                    $.each(data.feed.entry, function(i, item){
                        // ビデオに設定されているキーワードがない
                        if (item.media$group.media$keywords == null) return true;
                        // キーワードを配列に変換
                        var keywords = item.media$group.media$keywords.$t.split(", ");
                        if (keywords.length == 0) return true;
                        // 各キーワードを判別
                        $.each(keywords, function(n, keyword){
                            if ((keyword != str) &&                      // 検索キーワードと違う
                                (keyword.indexOf(str) == 0) &&           // 検索キーワードで始まる
                                ($.inArray(keyword, suggests) == -1)) {  // 既にSuggestに追加されていない
                                suggests.push(keyword);
                                $("#suggest").append($("<option/>").text(keyword));
                            }
                        });
                    });

                    // Suggestが0件
                    if (suggests.length == 0) return;
                    // Suggestを表示
                    $("#suggest")
                        .show()
                        [0].selectedIndex = -1;
                }
            });
        }
    };

    // 名前空間 window.yt に公開
    window.yt = new Youtube();
})();