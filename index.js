const express = require("express");
const app = express();
const path = require("path");
const axios = require('axios');
const ejsMate = require("ejs-mate");
const AsyncError = require("./asyncError");
const catchAsync = require("./utils/catchAsync");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"public")));

app.get("/", catchAsync(async(req,res,next)=>{
    const {search} = req.query;
    if(search){
        const shows = await axios.get(`https://api.tvmaze.com/search/shows?q=${search}`);
        if(shows.data.length){
        res.render("home",{shows: shows.data});
        }
        else{
            throw new AsyncError("Cannot find that TV show!",404);
        }
    }
    else{
        const shows = await axios.get("https://api.tvmaze.com/shows");
        const filt = shows.data.filter((f)=>{
            return f.rating.average > 8.5;
        });
          res.render("home",{showing:filt});
    }
}));
app.get("/movies",async(req,res)=>{
    const typeOfShow = [];
    const {type} = req.query;
    if(type){
        const shows = await axios.get("https://api.tvmaze.com/shows");
        for(let showS of shows.data){
            if(showS.genres.length>0){
                for(let genre of showS.genres){
                    if(genre===type){
                        typeOfShow.push(showS);
                    }
                }
            }
    }
    res.render("movies/type",{shows:typeOfShow,type});
    }
});


app.get("/movies/:id", catchAsync(async(req,res)=>{
    const {id} = req.params;
    const show = await axios.get(`https://api.tvmaze.com/shows/${id}?embed=cast`);
    console.log(show.data);
    res.render("movies/show",{show:show.data});
}));

app.use((err,req,res,next)=>{
    const {status=500} = err;
    if(!err.message){
        err.message = "Something went wrong!"
    }
    res.status(status).render("err",{err});

})

const port = process.env.PORT || 3000;
app.listen(port,()=>{
    console.log("Server is running on the port 3000!");
}) 