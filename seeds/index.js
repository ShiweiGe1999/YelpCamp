
const mongoose = require('mongoose');
const Campground = require('../models/campground')
const cities = require('./cities')
const {places, descriptors}  = require('./seedHelpers')

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error"))
db.once('open', () => {
    console.log("Database connected");
})

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for(let i = 0; i < 300; i++) {
        const random1000 = Math.floor(Math.random()*1000);
        const price = Math.floor(Math.random() * 20) + 10 ;
        const camp = new Campground({
            author: '60aeaff093e6745f00086d00',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)}, ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Laborum eaque ab distinctio corporis autem et facilis animi blanditiis sint ex. In ducimus vero sunt, ea similique accusantium amet distinctio esse!',
            price,
            geometry: { type: 'Point', coordinates: [ cities[random1000].longitude, cities[random1000].latitude ] },
            images: [
                {  
                  url: 'https://res.cloudinary.com/geshiwei/image/upload/v1622746991/YelpCamp/farshad-rezvanian-Eelegt4hFNc-unsplash_hlmtju.jpg',
                  filename: 'YelpCamp/hz14vcrs5yogx06whnnm'
                },
                {       
                  url: 'https://res.cloudinary.com/geshiwei/image/upload/v1622746986/YelpCamp/modestas-urbonas-vj_9l20fzj0-unsplash_act4xr.jpg',
                  filename: 'YelpCamp/etrqhjdnubzxpo8hmbej'
                }
              ]
        })
        await camp.save()
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})
