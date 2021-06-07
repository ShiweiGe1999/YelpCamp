if(process.env.NODE_ENV !== "production") {
    require('dotenv').config()
}


// require('dotenv').config()
const express = require('express');
const app = express();
const path = require('path')
const methodOverride = require('method-override')
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError')
const { urlencoded } = require('express');
const morgan = require('morgan');
const session = require('express-session')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const User = require('./models/user')
const mongoSanitize = require('express-mongo-sanitize');
const userRoutes = require('./routes/users')
const campgroundRoutes = require('./routes/campgrounds')
const reviewRoutes = require('./routes/reviews');
const ExpressMongoSanitize = require('express-mongo-sanitize');
const helmet = require("helmet")
const MongoStore = require('connect-mongo');
console.log(JSON.stringify(process.env.NODE_ENV))
// const dbUrl = process.env.DB_URL;
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';
// 'mongodb://localhost:27017/yelp-camp'
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
});

//middleware
app.use(urlencoded({extended:true}))
app.use(methodOverride('_method'))
app.use(morgan('tiny'))
app.use(express.static(path.join(__dirname, 'public')))

app.use(cookieParser())

const secret = process.env.SECRET || "this should be secret";

const store =  MongoStore.create({
    mongoUrl: dbUrl,
    crypto:{
        secret
    },
    touchAfter: 24 * 60 * 60
})

store.on("error", (e) => {
    console.log("Session store error", e)
})

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000*60*60*24*7,
        maxAge: 1000*60*60*24*7
    }
}
app.use(session(sessionConfig))
app.use(flash());
app.use(helmet())

const scriptSrcUrls = [
    "https://api.mapbox.com/",
    "https://cdn.jsdelivr.net/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/"
];
const styleSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://kit-free.fontawesome.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
]
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/geshiwei/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
                "https://source.unsplash.com/"
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(mongoSanitize());
app.use(passport.initialize());
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())
app.use((req, res, next) => {
    console.log(req.query)
    // console.log(req.session)
    res.locals.currentUser = req.user
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error');
    next();
})


const db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error"))
db.once('open', () => {
    console.log("Database connected");
})

//Engine

app.engine('ejs', ejsMate);

//setter

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname,'views'))

app.use('/',userRoutes)
app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)


app.get('/', (req, res) => {
    res.render('home');
})

app.get('/fakeUser', async(req, res) => {
    const user = new User({email: 'coltt@gmail.com', username: 'colt'})
    const newUser = await User.register(user, 'chicken')
    res.send(newUser)
})





app.all('*', (req, res ,next) => {
    next(new ExpressError('Page not found', 404))
})


app.use((err, req, res, next) => {
    const {statusCode = 500, message = "Something went wrong"}  = err
    res.status(statusCode).render('error', {err})
})


app.use((req, res) => {
    res.status(404).send('NOT FOUND!')
})




const port = process.env.PORT || 3000;
app.listen(port ,() => {
    console.log(`Serving on port ${port}`)
});

