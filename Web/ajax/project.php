<?

error_reporting(E_ALL);
ini_set('display_errors','stdout');

$video = (!empty($_REQUEST['video'])) ? $_REQUEST['video'] : "";
$video = str_replace('watch?v=', '/v/', $video);
$video .= '?autoplay=1';

$command = '/Users/DesignAndDevelopment/Projects/Sounds/scripts/project ';
$command .= (!empty($_REQUEST['command'])) ? $_REQUEST['command'] : 'play ' . $video;

system($command);

?>