'use strict';
//1. Require the package
const express = require('express')

//2. Create express app and port
const app = express()
const port = 3000;

//using the cors
const cors = require('cors');
app.use(cors());

//using axios
const axios = require('axios').default;

//API key definition
require('dotenv').config()
let apiKey = process.env.API_KEY
//apiKey = 34b8cbc4250b99e802ce858d4cb64a12

// 1 Movie Response
// Require the data file
const movieData = require('./Movie_Data/data.json');
//Calling the method
app.get('/',homeResponse)

//a function to retrieve the data
function homeResponse(req, res) {
  let result = [];
  movieData.data.forEach(element => {
      let newMovie = new Movie(
        element.title,
        element.poster_path,
        element.overview
      );
      result.push(newMovie);
  })
  res.json(result);
}


//The constructor to create a new response from the json data file
function Movie(title, poster_path, overview) {
  this.title = title;
  this.poster_path = poster_path;
  this.overview = overview
}


// 2 Favorite page response
app.get('/favorite',favoritePage);
function favoritePage(req,res){
res.send('Welcome to Favorite Page');
}


// let apiKey = '34b8cbc4250b99e802ce858d4cb64a12'
//4. Getting the trending movies
app.get('/trending',trendingHandler)
function trendingHandler(req,res){
let url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`
axios.get(url)
.then((result)=>{
  let movie = result.data.results.map((element)=>{
    return new Trendingmovie(element.id, element.title, element.release_date, element.poster_path, element.overview)
  })
  res.json(movie);
})
.catch((error)=>{
  console.log(error)
  res.send('error in getting data')
})
}

//A Constructor for the trending movies
function Trendingmovie(id, title, release_date, poster_path, overview) {
  this.id = id;
  this.title = title;
  this.release_date = release_date;
  this.poster_path = poster_path;
  this.overview = overview
}

//5. Search for a movie by name
app.get('/search',searchMovieHandler)
function searchMovieHandler(req,res){
  let movie = req.query.movie
  let url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movie}`
  axios.get(url)
  .then((result)=>{
    console.log(result.data.results);
    res.send(result.data)
  })
  .catch((error)=>{
    console.log(error);
    res.send('Error in getting data from api')
  })
}


//6. The additional route 1 -- The top rated movies with the following details
// 1. title
// 2. vote average
app.get('/topRated',topRatedHandler)
function topRatedHandler(req,res){
  let url =`https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}`
  axios.get(url)
  .then((result)=>{
    let topRated = result.data.results.map((element)=>{
      return new TopRated(element.title, element.vote_average);
    })
    res.json(topRated)
  })
  .catch((error)=>{
    console.log(error);
    res.send('Error in getting data from api')
  })
}

//A Constructor for top rated movies
function TopRated(title, vote_average){
  this.title = title;
  this.vote_average = vote_average;
}

// 7. The additional route 2 -- Getting the upcoming movies with the following details: 
// 1. title
// 2. original language
// 3. overview
// 4. popularity

//A Constructor for the Upcoming movies
function UpcomingMovies(title, original_language, overview, popularity){
  this.title = title;
  this.original_language = original_language;
  this.overview = overview;
  this.popularity = popularity;
}

// handling the upcoming movies function
app.get('/upcomingMovies',upcomingMoviesHandler)
function upcomingMoviesHandler(req,res){
  let url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}`
  axios.get(url)
  .then((result)=>{
    console.log(result.data.results)
    let upcoming = result.data.results.map((element)=>{
      return new UpcomingMovies(element.title, element.original_language, element.overview, element.popularity)
    })
    res.json(upcoming);
  })
  .catch((error)=>{
    console.log(error)
    res.send('Error in getting data from api')
  })
}

//--------------------------------------- The DATABASE Part -------------------------------------------
//For Body Parser using
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//For using the pg tool
const { Client } = require('pg');
const client = new Client(process.env.DATABASE_URL);

//Routs
app.post('/addMovie', postHandler)
app.get('/getMovies',getHandler)
app.put('/UPDATE/:movieID',updateHandler)
app.delete('/DELETE/:movieID',deleteHandler)
app.get('/getMovie/:movieID',getSpecificMovieHandler)


//Functions
function postHandler(req,res){
  let sql = `INSERT INTO addedmoviesid(title,year,personalComments) VALUES($1, $2, $3) RETURNING *;`;
  let {title,year,personalComments} = req.body; //destructuring
  let values = [title,year,personalComments]; 
  client.query(sql,values).then(result =>{
      console.log(result)
      return res.status(201).json(result.rows)
  }).catch((error)=>{
      console.log(error)
  })
  }

function getHandler(req, res) {
    let sql = `SELECT * FROM addedmoviesid;`;
    client.query(sql).then((result)=>{
        console.log(result);
        res.json(result.rows);
    }).catch((error) => {
        console.log(error)
    })
 }

function updateHandler(req,res){
  let id = req.params.movieID;
  let {title,year,personalComments} = req.body;
  let values = [title,year,personalComments];
  let sql = `UPDATE addedmoviesid SET title = $1, year = $2, personalComments = $3 WHERE id = ${id} RETURNING *;`;
  client.query(sql, values).then(result=>{
    res.json(result.rows);
  }).catch(error =>{
    console.log(error);
  })
}

function deleteHandler(req,res){
  let id = req.params.movieID;
  let sql = `DELETE FROM addedmoviesid WHERE id=${id}`
  client.query(sql).then(result =>{
    res.send('Movie Deleted Successfully')
  }).then(error =>{
    console.log(error)
  })
}

function getSpecificMovieHandler(req,res){
  let id = req.params.movieID;
  let sql = `SELECT * FROM addedmoviesid WHERE id=${id}`
  client.query(sql).then(result =>{
    res.json(result.rows);
  }).catch(error=>{
    console.log(error)
  })
}

// Check if the server is listening to the defined port
client.connect().then(() => {
  app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
  })
})

// handling the 404  and 500 errors
app.get('*', errorHandler)
function errorHandler(req, res){
  if(res.status(404)){
  res.status(404).send({
    "status": 404,
    "responseText": 'page not found error'
  });
}
else if(res.status(500)){
  res.status(500).send({
    "status": 500,
    "responseText": 'Sorry, something went wrong'
  });
}
}