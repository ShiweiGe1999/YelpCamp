const Campground = require('../models/campground');
const {cloudinary} = require('../cloudinary')
const mbxClient = require('@mapbox/mapbox-sdk');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding")
const mapBoxToken = process.env.MAPBOX_TOKEN
const baseClient = mbxClient({ accessToken: mapBoxToken });
const geocoder = mbxGeocoding(baseClient)
module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    // if(!req.cookies.count) {
    //     res.cookie('count', 1)
    // } else {
    //     let a = req.cookies.count
    //     a++
    //     res.cookie('count',a++)
    // }
    // console.log(req.cookies)
    res.render('campgrounds/index', {campgrounds})
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new')
}

module.exports.createCampground = async (req, res, next) => {
    // if(!req.body.campground) throw new ExpressError("Invalid Campground data", 400)
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const newCampground = req.body.campground
    const campground = new Campground(newCampground)
    campground.geometry = geoData.body.features[0].geometry
    campground.images = req.files.map( f => {
        const newFile = {
            url: f.path,
            filename: f.filename
        }
        return newFile
    })
    campground.author = req.user._id
    await campground.save()
    console.log(campground)
    req.flash('success', 'Successfully made a new campground')
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.showCampground = async (req, res) => {
    const {id} = req.params
    const campground = await Campground.findById(id).populate({
            path: 'reviews',
            populate: {
                path: 'author'
            }
        }).populate('author');
    // console.log(req.user)
    // console.log(req.session)

    if(!campground) {
        req.flash('error', 'Cannot find that campground!')
        return res.redirect('/campgrounds')
    }
    res.render('campgrounds/show', {campground});
}

module.exports.renderEditForm = async (req, res) => {
    const {id} = req.params;
    const campground = await Campground.findById(id)
    if(!campground) {
        req.flash('error', 'Cannot find that campground!')
        return res.redirect('/campgrounds')
    }
    res.render('campgrounds/edit', {campground})
}

module.exports.updateCampground = async (req, res) => {
    const {id} = req.params;
    const updateCamp = req.body.campground;
    // console.log(updateCamp)
    console.log(req.body)
    const camp = await Campground.findByIdAndUpdate(id,{...updateCamp},{runValidators: true, new: true})
    const imgs = req.files.map(f => ({url: f.path, filename: f.filename}))
    camp.images.push(...imgs);
    await camp.save();
    if(req.body.deleteImages) {
        for(let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await camp.updateOne({$pull: {images: {filename: { $in: req.body.deleteImages}}}})
        console.log(camp)
    }
    req.flash('success', "Successfully updated!")
    // console.log(campground);
    // console.log({...updateCamp})
    res.redirect(`/campgrounds/${id}`)
}

module.exports.deleteCampground = async (req, res) => {
    const {id} = req.params
    const camp = await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground')
    res.redirect('/campgrounds');
}