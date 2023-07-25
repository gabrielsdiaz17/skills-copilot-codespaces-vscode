// Create web server with express
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { randomBytes } = require('crypto');
const { default: Axios } = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

// Get all comments for a post
app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

// Create new comment
app.post('/posts/:id/comments', async (req, res) => {
  // Generate random id for comment
  const commentId = randomBytes(4).toString('hex');
  // Get the comment data from the request body
  const { content } = req.body;

  // Get the comments array for the post
  const comments = commentsByPostId[req.params.id] || [];

  // Add the new comment to the comments array
  comments.push({ id: commentId, content, status: 'pending' });

  // Update the comments array for the post
  commentsByPostId[req.params.id] = comments;

  // Emit an event to the event bus with the comment data
  await axios.post('http://localhost:4005/events', {
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: 'pending',
    },
  });

  // Send the comment data back to the client
  res.status(201).send(comments);
});

// Receive events from the event bus
app.post('/events', async (req, res) => {
  console.log('Received Event', req.body.type);

  // Get the event data from the request body
  const { type, data } = req.body;

  // Check if the event is of type CommentModerated
  if (type === 'CommentModerated') {
    // Get the comments array for the post
    const comments = commentsByPostId[data.postId];

    // Find the comment with the same id as the event data
    const comment = comments.find((comment) => {
      return comment.id === data.id;
    });

    // Update the status of the comment to the status from the event data
    comment.status = data.status;

    // Emit

