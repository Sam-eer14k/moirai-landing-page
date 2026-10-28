<?php
/**
 * Fallback template. The landing page itself is front-page.php; set a static front page under Settings > Reading.
 *
 * @package MoirAI
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require get_theme_file_path( 'front-page.php' );
