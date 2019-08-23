'use strict';

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const uuid = require('uuid/v4');
const { NODE_ENV } = require('./config');
const app = express();

//setup morgan and helmet
const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());

//validate auth token
function validateBearerToken(req, res, next) {
    const authHeader = req.get('Authorization');

    if(authHeader === undefined || 
        !authHeader.toLowerCase().startsWith('bearer')) {
            return res.status(401).json({error: "No valid Auth header found"})
        }
    const token = authHeader.split(' ')[1];

    if(token != process.env.API_TOKEN) {
        return res.status(401).json({error: 'Invalid credentials'});
    }
    next();
}

app.use(validateBearerToken)

//set up winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'info.log' })
    ]
});

if (NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

//dataset

let bookmarks = [
    {
        "id": "28aa3191-5a16-4767-b02c-77b66fd48664",
        "title": "Google",
        "url": "http://google.com",
        "desc": "An indie search engine startup",
        "rating": 4
      },
      {
        "id": "1cfae07c-653a-4a7e-8aaa-47a5a2ac2d28",
        "title": "Fluffiest Cats in the World",
        "url": "http://medium.com/bloggerx/fluffiest-cats-334",
        "desc": "The only list of fluffy cats online",
        "rating": 5
      }
];

//set up routers
app.get('/bookmarks', (req, res) => {
    return res
        .json(bookmarks)
});

app.get('/bookmarks/:id', (req, res) => {
    const bookmarkid = req.params.id;
    const results = bookmarks.filter(obj => obj.id === bookmarkid)
    if(results.length === 0) {
        return res
            .status(404)
    }
    return res
        .json(results);
})

const jsonParser = express.json();

const validUrl = require('valid-url');

app.post('/bookmarks', jsonParser, (req, res) => {
    //destructure req data
    const { title, url, desc, rating } = req.body;
    //validate title data
    if(!title) {
        return res
            .status(400)
            .send('The title is required.')
    }
    if(title.length < 2, title.length > 20) {
        return res
            .status(400)
            .send('The title must be between 2 and 20 characters.')
    }
    //validate url
    if(!url) {
        return res
            .status(400)
            .send("A url is required.")
    }
    if(validUrl.isUri(url)) {
        return res
            .status(400)
            .send('The url must be a valid url.')
    }
    //validate desc
    if(!desc) {
        return res
            .status(400)
            .send('The description is required.')
    }
    if(desc.length < 8 || desc.length > 60) {
        return res
            .status(400)
            .send('The description must be between 8 and 60 characters.')
    }
    //validate rating
    if(!rating) {
        return res
            .status(400)
            .send('Rating is required.');
    }
    
    const ratingMustBe = [1, 2, 3, 4, 5];

    if(!ratingMustBe.includes(parseInt(rating))) {
        return res
            .status(400)
            .send('Rating must be one of "1", "2", "3", "4", or "5".');
    }

    //add the new bookmark to bookmarks
    const id = uuid();

    const newBookmark = {
        id,
        title, 
        url, 
        desc, 
        rating,
    };

    console.log(newBookmark);
    console.log(bookmarks);
    bookmarks.push(newBookmark);
    console.log(bookmarks);

    return res
        .status(201)
        .send(newBookmark);
});

//delete a bookmark
app.delete('/bookmarks/:id', (req, res) => {
    const bookmarkId = req.params.id;
    console.log(bookmarkId);
    //validate the bookmark id
    const removed = bookmarks.filter(obj => obj.id === bookmarkId);
    if(removed.length === 0) {
        return res
            .status(400)
            .send('Bookmark does not exist');
    }
    //remove bookmark from bookmarks
    bookmarks = bookmarks.filter(obj => obj.id !== bookmarkId);
    return res
        .send(bookmarkId)
})

//set up error handler
app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } }
    } else {
        console.error(error)
        response = { message: error.message, error }
    }
        res.status(500).json(response)
})

app.use(cors());

module.exports = app;