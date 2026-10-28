<?php
/**
 * MoirAI Cloud theme functions.
 *
 * @package MoirAI
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'MOIRAI_VERSION', '1.0.0' );

/**
 * Where contact form messages go. Change it under Settings > General > "MoirAI enquiry email".
 * Falls back to the site admin email until it is set.
 */
function moirai_lead_email() {
	$email = get_option( 'moirai_lead_email' );
	return is_email( $email ) ? $email : get_option( 'admin_email' );
}

/**
 * URL of a file inside the theme.
 */
function moirai_asset( $path ) {
	return esc_url( get_theme_file_uri( $path ) );
}

/* ------------------------------------------------------------------
 * Theme setup
 * ------------------------------------------------------------------ */
function moirai_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
}
add_action( 'after_setup_theme', 'moirai_setup' );

function moirai_document_title( $title ) {
	if ( is_front_page() ) {
		$title['title']   = 'MoirAI Cloud';
		$title['tagline'] = 'Synaptix™, the AI Infrastructure Operating Platform';
		unset( $title['site'] );
	}
	return $title;
}
add_filter( 'document_title_parts', 'moirai_document_title' );

function moirai_title_separator() {
	return '|';
}
add_filter( 'document_title_separator', 'moirai_title_separator' );

/* ------------------------------------------------------------------
 * Styles and scripts
 * ------------------------------------------------------------------ */
function moirai_enqueue() {
	wp_enqueue_style(
		'moirai-fonts',
		'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap',
		array(),
		null
	);
	wp_enqueue_style( 'moirai-style', get_stylesheet_uri(), array( 'moirai-fonts' ), MOIRAI_VERSION );
	wp_enqueue_script( 'moirai-main', get_theme_file_uri( 'assets/js/main.js' ), array(), MOIRAI_VERSION, array( 'in_footer' => true, 'strategy' => 'defer' ) );
}
add_action( 'wp_enqueue_scripts', 'moirai_enqueue' );

function moirai_resource_hints( $urls, $relation ) {
	if ( 'preconnect' === $relation ) {
		$urls[] = 'https://fonts.googleapis.com';
		$urls[] = array(
			'href'        => 'https://fonts.gstatic.com',
			'crossorigin' => 'anonymous',
		);
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'moirai_resource_hints', 10, 2 );

/* ------------------------------------------------------------------
 * Head: favicons, meta, structured data
 * ------------------------------------------------------------------ */
function moirai_head_meta() {
	// Theme favicons are used until a Site Icon is set in the Customizer.
	if ( ! has_site_icon() ) {
		?>
		<link rel="icon" href="<?php echo moirai_asset( 'assets/images/favicon.ico' ); ?>" sizes="any">
		<link rel="icon" type="image/png" sizes="32x32" href="<?php echo moirai_asset( 'assets/images/favicon-32x32.png' ); ?>">
		<link rel="icon" type="image/png" sizes="16x16" href="<?php echo moirai_asset( 'assets/images/favicon-16x16.png' ); ?>">
		<link rel="apple-touch-icon" sizes="180x180" href="<?php echo moirai_asset( 'assets/images/apple-touch-icon.png' ); ?>">
		<?php
	}
	?>
	<meta name="theme-color" content="#05173f">
	<?php
	if ( ! is_front_page() ) {
		return;
	}
	?>
	<link rel="preload" as="image" type="image/webp" href="<?php echo moirai_asset( 'assets/images/hero-poster.webp' ); ?>">
	<meta name="description" content="Synaptix™ by MoirAI Cloud brings compute, networking, storage and monitoring into one console, with integrated AI that helps operators investigate issues and decide what to do next.">
	<meta property="og:site_name" content="MoirAI Cloud">
	<meta property="og:title" content="MoirAI Cloud | AI infrastructure operations with Synaptix™">
	<meta property="og:description" content="One console for compute, networking, storage and monitoring, with integrated AI and operator control.">
	<meta property="og:type" content="website">
	<meta property="og:image" content="<?php echo moirai_asset( 'assets/images/og-image.jpg' ); ?>">
	<meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:site" content="@MoirAICloud">
	<script type="application/ld+json">
	<?php
	echo wp_json_encode(
		array(
			'@context' => 'https://schema.org',
			'@type'    => 'Organization',
			'name'     => 'MoirAI Cloud',
			'url'      => home_url( '/' ),
			'email'    => 'support@moiraicloud.ai',
			'founder'  => array(
				array(
					'@type'    => 'Person',
					'name'     => 'Robert Twitchell',
					'jobTitle' => 'Founder & CEO',
				),
				array(
					'@type'    => 'Person',
					'name'     => 'Daniel Twitchell',
					'jobTitle' => 'Founder & CRO',
				),
			),
			'sameAs'   => array(
				'https://x.com/MoirAICloud',
				'https://www.instagram.com/moirai.cloud/',
				'https://www.linkedin.com/company/moirai-cloud/about/',
			),
		),
		JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
	);
	?>
	</script>
	<?php
}
add_action( 'wp_head', 'moirai_head_meta', 2 );

/* ------------------------------------------------------------------
 * Settings: enquiry email field under Settings > General
 * ------------------------------------------------------------------ */
function moirai_register_settings() {
	register_setting(
		'general',
		'moirai_lead_email',
		array(
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_email',
			'default'           => '',
		)
	);
	add_settings_field(
		'moirai_lead_email',
		'MoirAI enquiry email',
		function () {
			printf(
				'<input type="email" name="moirai_lead_email" id="moirai_lead_email" class="regular-text" value="%s"><p class="description">Messages from the front page contact form go to this address. Leave blank to use the site admin email.</p>',
				esc_attr( get_option( 'moirai_lead_email' ) )
			);
		},
		'general'
	);
}
add_action( 'admin_init', 'moirai_register_settings' );

/* ------------------------------------------------------------------
 * Form handler (admin-post.php)
 * ------------------------------------------------------------------ */
function moirai_redirect_back( $status ) {
	$url = wp_get_referer() ? wp_get_referer() : home_url( '/' );
	$url = remove_query_arg( 'moirai', $url );
	$url = preg_replace( '/#.*$/', '', $url );
	wp_safe_redirect( add_query_arg( 'moirai', $status, $url ) . '#contact' );
	exit;
}

function moirai_handle_contact() {
	if ( ! isset( $_POST['moirai_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['moirai_nonce'] ) ), 'moirai_contact' ) ) {
		moirai_redirect_back( 'error' );
	}
	// Honeypot: real visitors never see this field.
	if ( ! empty( $_POST['website'] ) ) {
		moirai_redirect_back( 'sent' );
	}

	$field = function ( $key ) {
		return isset( $_POST[ $key ] ) ? sanitize_text_field( wp_unslash( $_POST[ $key ] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce checked above.
	};
	$name        = $field( 'name' );
	$email       = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	$company     = $field( 'company' );
	$environment = $field( 'environment' );
	$message     = isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '';

	if ( strlen( $name ) < 2 || ! is_email( $email ) || strlen( $message ) < 10 ) {
		moirai_redirect_back( 'invalid' );
	}

	$body = implode(
		"\n",
		array(
			'Name: ' . $name,
			'Email: ' . $email,
			'Company: ' . ( $company ? $company : 'Not given' ),
			'Environment: ' . ( $environment ? $environment : 'Not given' ),
			'',
			$message,
		)
	);

	$sent = wp_mail(
		moirai_lead_email(),
		sprintf( 'Synaptix enquiry from %s%s', $name, $company ? ', ' . $company : '' ),
		$body,
		array( 'Reply-To: ' . $name . ' <' . $email . '>' )
	);

	moirai_redirect_back( $sent ? 'sent' : 'error' );
}
add_action( 'admin_post_nopriv_moirai_contact', 'moirai_handle_contact' );
add_action( 'admin_post_moirai_contact', 'moirai_handle_contact' );

/**
 * Status message for the form after the redirect.
 *
 * @return array{0:string,1:string} [css class, message]
 */
function moirai_form_status() {
	$status = isset( $_GET['moirai'] ) ? sanitize_key( wp_unslash( $_GET['moirai'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display only.
	switch ( $status ) {
		case 'sent':
			return array( 'is-ok', 'Thanks. Your message is with the MoirAI team and they will reply by email.' );
		case 'invalid':
			return array( '', 'Some details were missing. Add your name, a valid email and a line about what you need, then send again.' );
		case 'error':
			return array( '', 'That did not go through. Please email support@moiraicloud.ai instead.' );
	}
	return array( '', '' );
}
