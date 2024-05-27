<?php
/**
 * Plugin Name: Gutenberg Slideshow
 * Description: A Gutenberg block that fetches and displays a slideshow of posts.
 * Version: 1.0.0
 * Author: Soham
 */

function gutenberg_slideshow_block_init() {
    $dir = dirname( __FILE__ );

    $script_asset_path = "$dir/build/index.asset.php";
    if ( ! file_exists( $script_asset_path ) ) {
        throw new Error(
            'You need to run `npm start` or `npm run build` first.'
        );
    }
    $script_asset = require( $script_asset_path );
    $index_js     = 'build/index.js';
    wp_register_script(
        'gutenberg-slideshow-block-editor',
        plugins_url( $index_js, __FILE__ ),
        $script_asset['dependencies'],
        $script_asset['version']
    );

    $editor_css = 'build/index.css';
    wp_register_style(
        'gutenberg-slideshow-block-editor',
        plugins_url( $editor_css, __FILE__ ),
        array(),
        filemtime( "$dir/$editor_css" )
    );

    $style_css = 'build/style-index.css';
    wp_register_style(
        'gutenberg-slideshow-block',
        plugins_url( $style_css, __FILE__ ),
        array(),
        filemtime( "$dir/$style_css" )
    );

    register_block_type( 'gutenberg-slideshow/block', array(
        'editor_script' => 'gutenberg-slideshow-block-editor',
        'editor_style'  => 'gutenberg-slideshow-block-editor',
        'style'         => 'gutenberg-slideshow-block',
        'render_callback' => 'render_slideshow_block',
    ) );
}

function render_slideshow_block($attributes) {
    $url = isset($attributes['url']) ? esc_url($attributes['url']) : 'https://wptavern.com/wp-json/wp/v2/posts';
    $autoplay = isset($attributes['autoplay']) ? $attributes['autoplay'] : false;

    // Extract the base URL
    $parsed_url = wp_parse_url($url);
    $base_url = $parsed_url['scheme'] . '://' . $parsed_url['host'];

    // Fetch the posts
    $response = wp_remote_get($url);
    if (is_wp_error($response)) {
        return '<p>' . __('Error fetching posts', 'text-domain') . '</p>';
    }

    $posts = json_decode(wp_remote_retrieve_body($response), true);
    if (!$posts) {
        return '<p>' . __('No posts found', 'text-domain') . '</p>';
    }

    // Build the HTML
    ob_start();
    ?>
    <div class="slideshow-container" data-autoplay="<?= $autoplay ?>">
        <?php foreach ($posts as $index => $post) : 
            $image_url = null;
            if ($post['featured_media']) {
                $media_url = $base_url . '/wp-json/wp/v2/media/' . $post['featured_media'];
                $media_response = wp_remote_get($media_url);
                if (!is_wp_error($media_response)) {
                    $media = json_decode(wp_remote_retrieve_body($media_response), true);
                    $image_url = isset($media['source_url']) ? $media['source_url'] : '';
                }
            }
            ?>
            <a href="<?php echo esc_url($post['link']); ?>" target="_blank" rel="noopener noreferrer" class="slide <?php echo $index === 0 ? 'active' : ''; ?>">
                <div class="card">
                    <?php if ($image_url) : ?>
                        <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($post['title']['rendered']); ?>">
                    <?php endif; ?>
                    <h2><?php echo esc_html($post['title']['rendered']); ?></h2>
                    <p><?php echo esc_html(date('Y-m-d', strtotime($post['date']))); ?></p>
                </div>
            </a>
        <?php endforeach; ?>
    </div>
    <?php
    return ob_get_clean();
}
add_action('init', 'gutenberg_slideshow_block_init');
