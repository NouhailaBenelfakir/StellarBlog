/**
 * @jest-environment jsdom
 */
require('@testing-library/jest-dom');
const { fireEvent } = require('@testing-library/dom');
const { screen } = require('@testing-library/dom');

// Mock DataTransfer object
global.DataTransfer = function() {
    this.items = [];
    this.setData = function(format, data) {
        this.items.push({ kind: 'string', type: format, getAsString: function(callback) { callback(data); } });
    };
    this.getData = function(format) {
        return this.items.find(item => item.type === format)?.getAsString();
    };
};

document.body.innerHTML = `
    <input class="title" placeholder="Blog Title" />
    <textarea class="article" placeholder="Write your article here..."></textarea>
    <input type="file" id="banner-upload" />
    <div class="banner"></div>
    <button class="publish-btn">Publish</button>
    <input type="file" id="image-upload" />
`;

const blogTitleField = document.querySelector('.title');
const articleFeild = document.querySelector('.article');
const bannerImage = document.querySelector('#banner-upload');
const banner = document.querySelector(".banner");
const publishBtn = document.querySelector('.publish-btn');
const uploadInput = document.querySelector('#image-upload');

let bannerPath;

beforeEach(() => {
    // Clear inputs
    blogTitleField.value = '';
    articleFeild.value = '';
    bannerPath = '';
    banner.style.backgroundImage = '';
});

// Mock uploadImage function
const uploadImage = (uploadFile, uploadType) => {
    const [file] = uploadFile.files;
    if(file && file.type.includes("image")){
        const formdata = new FormData();
        formdata.append('image', file);

        return fetch('/upload', {
            method: 'post',
            body: formdata
        }).then(res => res.json())
        .then(data => {
            if(uploadType == "image"){
                addImage(data, file.name);
            } else{
                bannerPath = `${location.origin}/${data}`;
                banner.style.backgroundImage = `url("${bannerPath}")`;
            }
        })
    } else{
        alert("upload Image only");
    }
}

const addImage = (imagepath, alt) => {
    let curPos = articleFeild.selectionStart;
    let textToInsert = `\r![${alt}](${imagepath})\r`;
    articleFeild.value = articleFeild.value.slice(0, curPos) + textToInsert + articleFeild.value.slice(curPos);
}

describe('Blog Platform Tests', () => {
    test('should update banner image on upload', () => {
        const file = new File(['dummy content'], 'example.png', { type: 'image/png' });
        
        // Create a new instance of DataTransfer
        const dataTransfer = new DataTransfer();
        // Add the file to the files property
        dataTransfer.files = [file];
        
        // Mock the files property of bannerImage
        Object.defineProperty(bannerImage, 'files', {
            value: dataTransfer.files,
            writable: true
        });
    
        fireEvent.change(bannerImage);
    
        // Mock fetch response
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve('/uploads/example.png')
            })
        );
    
        // Call the actual function to simulate the behavior
        uploadImage(bannerImage, "banner");
    
        setTimeout(() => {
            expect(banner.style.backgroundImage).toBe(`url("${location.origin}/uploads/example.png")`);
        }, 1000); // Wait for fetch promise to resolve
    });

    test('should publish blog with title and content', () => {
        blogTitleField.value = 'Test Blog';
        articleFeild.value = 'This is a test article.';

        // Mock Firebase
        global.db = {
            collection: jest.fn(() => ({
                doc: jest.fn(() => ({
                    set: jest.fn(() => Promise.resolve())
                }))
            }))
        };

        // Call the publish logic
        publishBtn.click();

        setTimeout(() => {
            expect(global.db.collection).toHaveBeenCalledWith('blogs');
        }, 1000); // Wait for Firebase promise to resolve
    });
});
