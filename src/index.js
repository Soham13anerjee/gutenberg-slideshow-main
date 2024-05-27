import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, TextControl } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import './editor.scss';
import './style.scss';

registerBlockType('gutenberg-slideshow/block', {
    apiVersion: 2,
    name: 'gutenberg-slideshow/block',
    title: 'Slideshow Block',
    icon: 'images-alt2',
    category: 'widgets',
    attributes: {
        url: {
            type: 'string',
            default: 'https://wptavern.com/wp-json/wp/v2/posts',
        },
        autoplay: {
            type: 'boolean',
            default: false,
        },
    },
    edit: ({ attributes, setAttributes }) => {
        const blockProps = useBlockProps();
        const [posts, setPosts] = useState([]);
        const [images, setImages] = useState([]);
        const [currentIndex, setCurrentIndex] = useState(0);

        useEffect(() => {
            if (attributes.url) {
                fetch(attributes.url)
                    .then(response => response.json())
                    .then(data => {
                        setPosts(data);
                        fetchImages(data);
                    })
                    .catch(error => console.error('Error fetching posts:', error));
            }
        }, [attributes.url]);

        const fetchImages = (data) => {
            const baseUrl = new URL(attributes.url).origin;
            const imageRequests = data.map(post => {
                if (post.featured_media) {
                    return fetch(`${baseUrl}/wp-json/wp/v2/media/${post.featured_media}`)
                        .then(response => response.json())
                        .then(media => media.source_url)
                        .catch(error => console.error('Error fetching image:', error));
                } else {
                    return Promise.resolve(null);
                }
            });

            Promise.all(imageRequests)
                .then(images => setImages(images))
                .catch(error => console.error('Error fetching images:', error));
        };

        useEffect(() => {
            let interval;
            if (attributes.autoplay && posts.length) {
                interval = setInterval(() => {
                    setCurrentIndex(prevIndex => (prevIndex + 1) % posts.length);
                }, 3000);
            }
            return () => clearInterval(interval);
        }, [attributes.autoplay, posts.length]);

        const updateURL = (newURL) => {
            setAttributes({ url: newURL });
        };

        return (
            <div {...blockProps}>
                <InspectorControls>
                    <PanelBody title="Slideshow Settings">
                        <TextControl
                            label="API URL"
                            value={attributes.url}
                            onChange={(value) => updateURL(value)}
                        />
                        <ToggleControl
                            label="Autoplay"
                            checked={attributes.autoplay}
                            onChange={(value) => setAttributes({ autoplay: value })}
                        />
                    </PanelBody>
                </InspectorControls>
                <div className="slideshow-container">
                    {posts.length ? (
                        posts.map((post, index) => (
                            <a href={post.link} target="_blank" rel="noopener noreferrer" key={post.id} className={`slide ${index === currentIndex ? 'active' : ''}`}>
                                <div className="card">
                                    {images[index] && <img src={images[index]} alt={post.title.rendered} />}
                                    <h2 className='post-title'>{post.title.rendered}</h2>
                                    <p className='date'>{new Date(post.date).toLocaleDateString()}</p>
                                </div>
                            </a>
                        ))
                    ) : (
                        <p>Loading...</p>
                    )}
                </div>
            </div>
        );
    },
    save: ({ attributes }) => {
        return (
            <div {...useBlockProps.save()}>
                <div className="slideshow-container" data-url={attributes.url} data-autoplay={attributes.autoplay}></div>
            </div>
        );
    },
});

document.addEventListener('DOMContentLoaded', function() {
    const slideshows = document.querySelectorAll('.slideshow-container');

    slideshows.forEach(slideshow => {
        const autoplay = slideshow.dataset.autoplay === 'true';
        const slides = slideshow.querySelectorAll('.slide');
        let currentIndex = 0;
        const totalSlides = slides.length;

        const showSlide = (index) => {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
        };

        if (autoplay && totalSlides > 0) {
            setInterval(() => {
                currentIndex = (currentIndex + 1) % totalSlides;
                showSlide(currentIndex);
            }, 3000); // Change slides every 3 seconds
        }
    });
});
