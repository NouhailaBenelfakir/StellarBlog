/**
 * @jest-environment jsdom
 */
require('@testing-library/jest-dom');
const { fireEvent } = require('@testing-library/dom');
const { screen } = require('@testing-library/dom');



document.body.innerHTML = `
  <div class="blogs-section"></div>
`;

// Mock Firebase
global.db = {
  collection: jest.fn().mockReturnThis(),
  get: jest.fn()
};

const blogSection = document.querySelector('.blogs-section');

// Mock the blog data
const mockBlogs = [
  {
    id: '1',
    data: () => ({
      bannerImage: 'http://example.com/image1.jpg',
      title: 'Blog Title 1',
      article: 'This is the content of the first blog article.'
    })
  },
  {
    id: '2',
    data: () => ({
      bannerImage: 'http://example.com/image2.jpg',
      title: 'Blog Title 2',
      article: 'This is the content of the second blog article.'
    })
  }
];

global.db.get.mockResolvedValue({
  forEach: (callback) => {
    mockBlogs.forEach(callback);
  }
});

// Function to create blog cards
const createBlog = (blog) => {
  let data = blog.data();
  blogSection.innerHTML += `
    <div class="blog-card">
      <img src="${data.bannerImage}" class="blog-image" alt="">
      <h1 class="blog-title">${data.title.substring(0, 100) + '...'}</h1>
      <p class="blog-overview">${data.article.substring(0, 200) + '...'}</p>
      <a href="/${blog.id}" class="btn dark">read</a>
    </div>
  `;
};

// Script to get and display blogs
db.collection("blogs").get().then((blogs) => {
  blogs.forEach(blog => {
    if(blog.id != decodeURI(location.pathname.split("/").pop())){
      createBlog(blog);
    }
  });
});

describe('Blog Page Tests', () => {
  test('should retrieve and display blog data', async () => {
    // Wait for the mock data to be processed
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(global.db.collection).toHaveBeenCalledWith('blogs');
    expect(blogSection.innerHTML).toContain('http://example.com/image1.jpg');
    expect(blogSection.innerHTML).toContain('Blog Title 1...');
    expect(blogSection.innerHTML).toContain('This is the content of the first blog article.');
    expect(blogSection.innerHTML).toContain('http://example.com/image2.jpg');
    expect(blogSection.innerHTML).toContain('Blog Title 2...');
    expect(blogSection.innerHTML).toContain('This is the content of the second blog article.');
  });
});
