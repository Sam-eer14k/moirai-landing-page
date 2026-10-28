# Builds index.html (single file, CSS and JS inline) at the repo root and the
# WordPress theme from the sources in src/. Run:
#
#   powershell -ExecutionPolicy Bypass -File build.ps1
#
# Edit src/_head.html, src/_body.html, src/css/theme.css or src/js/main.js.
# Never edit index.html or the theme's style.css, front-page.php or main.js:
# they are generated and will be overwritten. functions.php and index.php in
# wordpress-theme/ are hand-written and safe to edit.
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$src = Join-Path $root 'src'
$utf8 = New-Object System.Text.UTF8Encoding($false)

# CONFIRM: the inbox that receives enquiries on the static site. moiraicloud.ai
# publishes only support@ (for technical issues). Swap in a sales address once
# MoirAI confirms one. The WordPress theme sends with wp_mail (see functions.php).
$LeadEmail = 'support@moiraicloud.ai'

function Read-Src($name) { [IO.File]::ReadAllText((Join-Path $src $name), $utf8) }
function Write-Out($path, $text) {
  $dir = Split-Path $path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
  [IO.File]::WriteAllText($path, $text.Replace("`r`n", "`n"), $utf8)
}

$head = Read-Src '_head.html'
$body = Read-Src '_body.html'
$css  = Read-Src 'css\theme.css'
$js   = Read-Src 'js\main.js'

foreach ($v in 'moirai-hero.mp4', 'moirai-hero.webm', 'moirai-hero-sm.mp4') {
  if (-not (Test-Path (Join-Path $root "assets\video\$v"))) { throw "Missing assets\video\$v (see README: Hero video)" }
}

# Conservative minifiers for the copy inlined into index.html (src/ stays readable).
function Minify-Css($s) {
  $s = [regex]::Replace($s, '(?s)/\*.*?\*/', '')
  $s = [regex]::Replace($s, '\s+', ' ')
  $s = [regex]::Replace($s, '\s*([{};,>])\s*', '$1')
  $s = [regex]::Replace($s, '([^\s(]):\s+', '$1:')
  $s = $s.Replace(';}', '}')
  return $s.Trim()
}
# JS: drop block comments, whole-line // comments, indentation and blank lines.
# Line breaks are kept so automatic semicolon insertion can't change behaviour.
function Minify-Js($s) {
  $s = [regex]::Replace($s, '(?s)/\*.*?\*/', '')
  $lines = $s -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('//') }
  return ($lines -join "`n")
}

# Sanity check: an unbalanced quote in the CSS silently drops every rule after it.
if ((([regex]::Matches($css, '"')).Count % 2) -ne 0) { throw 'theme.css has an odd number of double quotes' }
if ($body -match '[—–]') { throw 'An em or en dash is in _body.html (house style: none)' }
# Imagery rule: hero video and its stills appear only in the hero.
if ($body -match 'ops-(console|panel|wide)') { throw 'A hero-video still is referenced outside the hero' }

$cssMin = Minify-Css $css
$jsMin  = Minify-Js $js

# ---------------- static HTML ----------------
$htmlBody = $body.Replace('{{A}}', 'assets/').Replace('{{FORM_ACTION}}', "mailto:$LeadEmail").Replace('{{FORM_MODE}}', 'mailto')
$htmlBody = [regex]::Replace($htmlBody, '<!--WP:[a-z-]+-->', '')
$html = "<!doctype html>`n<html lang=""en"">`n<head>`n$head<style>$cssMin</style>`n</head>`n<body>`n$htmlBody`n<script>`n$jsMin`n</script>`n</body>`n</html>`n"
Write-Out (Join-Path $root 'index.html') $html
"index.html  $([math]::Round($html.Length / 1KB)) KB"

# ---------------- WordPress theme ----------------
$theme = Join-Path $root 'wordpress-theme'

$styleHeader = @'
/*
Theme Name: MoirAI Cloud
Author: Zaphyre
Description: One-page landing theme for MoirAI Cloud and Synaptix, the AI infrastructure operating platform. Set a static front page under Settings > Reading.
Version: 1.0.0
Requires at least: 6.0
Requires PHP: 7.4
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: moirai
*/

/* WordPress admin bar offset for the fixed header. */
body.admin-bar .hd { top: 32px; }
@media screen and (max-width: 782px) { body.admin-bar .hd { top: 46px; } }
@media screen and (max-width: 600px) { body.admin-bar .hd { top: 0; } }

'@
Write-Out (Join-Path $theme 'style.css') ($styleHeader + $css)
Write-Out (Join-Path $theme 'assets\js\main.js') $js

$wp = $body.Replace('{{A}}', '<?php echo esc_url( $moirai_a ); ?>')
$wp = $wp.Replace('action="{{FORM_ACTION}}"', 'action="<?php echo esc_url( admin_url( ''admin-post.php'' ) ); ?>"')
$wp = $wp.Replace('data-mode="{{FORM_MODE}}"', 'data-mode="wp"')
$wp = $wp.Replace('<!--WP:contact-fields-->', '<input type="hidden" name="action" value="moirai_contact"><?php wp_nonce_field( ''moirai_contact'', ''moirai_nonce'' ); ?>')
$wp = $wp.Replace('<!--WP:contact-status-->', '<?php echo esc_html( $moirai_status[1] ); ?>')
$wp = $wp.Replace('class="form__status" id="form-status"', 'class="form__status <?php echo esc_attr( $moirai_status[0] ); ?>" id="form-status"')
$wp = $wp.Replace('<span data-year>2026</span>', '<span data-year><?php echo esc_html( wp_date( ''Y'' ) ); ?></span>')
if ($wp -match '<!--WP:') { throw 'Unreplaced WP marker in body' }
if ($wp -match '\{\{') { throw 'Unreplaced {{ }} placeholder in body' }

$frontPage = @'
<?php
/**
 * Front page. Generated by build.ps1 from src/_body.html: edit the source, not this file.
 *
 * @package MoirAI
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$moirai_a      = trailingslashit( get_theme_file_uri( 'assets' ) );
$moirai_status = moirai_form_status();
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

'@ + $wp + @'

<?php wp_footer(); ?>
</body>
</html>

'@
Write-Out (Join-Path $theme 'front-page.php') $frontPage

foreach ($sub in @('images', 'video')) {
  $from = Join-Path $root "assets\$sub"
  $dst = Join-Path $theme "assets\$sub"
  # Mirror the folder so files removed from assets/ also leave the theme.
  if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
  New-Item -ItemType Directory -Force $dst | Out-Null
  Copy-Item (Join-Path $from '*') $dst -Force
}
"wordpress-theme regenerated"
