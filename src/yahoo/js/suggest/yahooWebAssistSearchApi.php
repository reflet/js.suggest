<?php

/**
 * YahooWebAssistSearchApiクラス
 */
class YahooWebAssistSearchApi
{
    const APPID         = '**********';
    const YahooAPI      = 'http://search.yahooapis.jp/AssistSearchService/V2/webassistSearch';
    const NUMBER        = 10;
    const TIMEOUT       = 3;

    /**
     * 検索ワード
     * @var string
     */
    private $_word      = '';

    /**
     * レスポンス
     * @var string
     */
    private $_response  = '';

    /**
     * コンストラクタ
     *
     * @access  public
     * @param   string  $str
     * @return  YahooWebAssistSearchApi
     */
    public function __construct($str = null)
    {
        if ($str) $this->setWord($str);
    }

    /**
     * 検索ワードをセット
     *
     * @access  public
     * @param   string  $str
     * @return  $this
     */
    public function setWord($str)
    {
        $this->_word = strtolower($str);
        return $this;
    }

    /**
     * リクエスト
     *
     * @access  public
     * @param   integer  $len
     * @return  $this
     */
    public function request()
    {
        $url = $this->_getRequestURL();
        if (empty($url)) return $this;

        try
        {
            $ch = curl_init ($url);
            curl_setopt ($ch, CURLOPT_HEADER, FALSE);
            curl_setopt ($ch, CURLOPT_FAILONERROR, TRUE);
            curl_setopt ($ch, CURLOPT_RETURNTRANSFER, TRUE);
            curl_setopt ($ch, CURLOPT_TIMEOUT, self::TIMEOUT);
            curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, self::TIMEOUT);
            curl_setopt ($ch, CURLOPT_USERAGENT, $this->_getUserAgent());
            $this->_response = curl_exec ($ch);
        }
        catch (Exception $e)
        {

        }
        return $this;
    }

    /**
     * 検索文字の一覧を取得する（EUC-JP）
     *
     * @access  public
     * @return  array
     */
    public function getWords()
    {
        if ( ! empty($this->_response))
        {
            $items = json_decode($this->_response);
            if (isset($items[1]) && is_array($items[1]))
            {
                mb_convert_variables('EUC-JP', 'UTF-8', $items);
                return $items[1];
            }
        }
        return array();
    }

    /**
     * YahooWebAssistSearchAPIのURLを生成する
     *
     * @access  private
     * @return  string
     */
    private function _getRequestURL()
    {
        $keyword = ($this->_word) ? $this->_word : '';
        if (empty($keyword)) return '';

        return self::YahooAPI.'?'.http_build_query(array(
            'appid'  => self::APPID,
            'output' => 'iejson',
            'p'      => $keyword,
            'n'      => self::NUMBER
        ));
    }

    /**
     * ユーザーエージェントを取得する
     *
     * @access  private
     * @return  string
     */
    private function _getUserAgent()
    {
        return ( ! empty ($_SERVER['HTTP_USER_AGENT'])) ? $_SERVER['HTTP_USER_AGENT'] : 'PHP';
    }
}
// END YahooWebAssistSearchApi Class

/* End of file yahooWebAssistSearchApi.php */
/* Location: ./_js/suggest/yahooWebAssistSearchApi.php */