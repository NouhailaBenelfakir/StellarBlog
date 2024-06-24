/**
 * @jest-environment jsdom
 */
require('@testing-library/jest-dom');
const { fireEvent } = require('@testing-library/dom');
const { screen } = require('@testing-library/dom');

// Mock Firestore
global.db = {
    collection: jest.fn(() => ({
        doc: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({
                exists: true,
                data: () => ({
                    title: 'Test Blog Title',
                    bannerImage: 'http://example.com/banner.jpg',
                    publishedAt: '24 Jun 2024',
                    article: '# Heading\nSome content\n![alt text](http://example.com/image.jpg)\nMore content'
                })
            }))
        }))
    }))
};

document.body.innerHTML = `
    <div class="banner"></div>
    <div class="title"></div>
    <title></title>
    <div class="published"></div>
    <div class="article"></div>
`;

const banner = document.querySelector('.banner');
const blogTitle = document.querySelector('.title');
const titleTag = document.querySelector('title');
const publish = document.querySelector('.published');
const article = document.querySelector('.article');

let blogId = 'test-blog-id'; // Mock blog ID

const setupBlog = (data) => {
    banner.style.backgroundImage = `url(${data.bannerImage})`;
    titleTag.innerHTML += blogTitle.innerHTML = data.title;
    publish.innerHTML += data.publishedAt;
    addArticle(article, data.article);
};

const addArticle = (ele, data) => {
    data = data.split("\n").filter(item => item.length);
    data.forEach(item => {
        if(item[0] === '#'){
            let hCount = 0;
            let i = 0;
            while(item[i] === '#'){
                hCount++;
                i++;
            }
            let tag = `h${hCount}`;
            ele.innerHTML += `<${tag}>${item.slice(hCount).trim()}</${tag}>`;
        } 
        else if(item[0] === "!" && item[1] === "["){
            let seperator;
            for(let i = 0; i <= item.length; i++){
                if(item[i] === "]" && item[i + 1] === "(" && item[item.length - 1] === ")"){
                    seperator = i;
                }
            }
            let alt = item.slice(2, seperator);
            let src = item.slice(seperator + 2, item.length - 1);
            ele.innerHTML += `<img src="${src}" alt="${alt}" class="article-image">`;
        } else {
            ele.innerHTML += `<p>${item}</p>`;
        }
    });
};

describe('Blog Page Tests', () => {
    test('should retrieve and display blog data', async () => {
        const docRef = db.collection('blogs').doc(blogId);

        const doc = await docRef.get();
        if (doc.exists) {
            setupBlog(doc.data());
        } else {
            location.replace("/");
        }

        expect(banner.style.backgroundImage).toBe('url(http://example.com/banner.jpg)');
        expect(blogTitle.innerHTML).toBe('Test Blog Title');
        expect(titleTag.innerHTML).toContain('Test Blog Title');
        expect(publish.innerHTML).toBe('24 Jun 2024');
        expect(article.innerHTML).toContain('<h1>Heading</h1>'); // Corrected expected string
        expect(article.innerHTML).toContain('<p>Some content</p>');
        expect(article.innerHTML).toContain('<img src="http://example.com/image.jpg" alt="alt text" class="article-image">');
        expect(article.innerHTML).toContain('<p>More content</p>');
    });

    test('should handle missing blog data', async () => {
        db.collection = jest.fn(() => ({
            doc: jest.fn(() => ({
                get: jest.fn(() => Promise.resolve({
                    exists: false
                }))
            }))
        }));

        delete window.location;
        window.location = { replace: jest.fn() };

        const docRef = db.collection('blogs').doc(blogId);

        const doc = await docRef.get();
        if (doc.exists) {
            setupBlog(doc.data());
        } else {
            location.replace("/");
        }

        expect(window.location.replace).toHaveBeenCalledWith("/");
    });
});
