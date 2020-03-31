<?php

/**
 * ------------------------------------------------------------------
 * Suggest�θ���������֤�API
 *
 * �� GET['q']��ɬ�ܤǤ�
 * ------------------------------------------------------------------
 */
require_once(dirname(__FILE__).'/yahooWebAssistSearchApi.php');

// ������ɤ����
$q = (isset($_GET['q'])) ? strtolower($_GET['q']) : '';

// ������������
$assist = new YahooWebAssistSearchApi($q);
$words  = $assist
    ->request()
    ->getWords();
echo implode("\n", $words)."\n";

/* End of file suggest.php */
/* Location: ./_js/suggest/suggest.php */