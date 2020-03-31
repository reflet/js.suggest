<?php

/**
 * ------------------------------------------------------------------
 * Suggestの検索候補を返すAPI
 *
 * ※ GET['q']が必須です
 * ------------------------------------------------------------------
 */
require_once(dirname(__FILE__).'/yahooWebAssistSearchApi.php');

// 検索ワードを取得
$q = (isset($_GET['q'])) ? strtolower($_GET['q']) : '';

// 検索候補を取得
$assist = new YahooWebAssistSearchApi($q);
$words  = $assist
    ->request()
    ->getWords();
echo implode("\n", $words)."\n";

/* End of file suggest.php */
/* Location: ./_js/suggest/suggest.php */