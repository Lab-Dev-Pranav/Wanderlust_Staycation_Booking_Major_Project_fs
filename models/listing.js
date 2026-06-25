const mongoose = require("mongoose");
const review = require("./review.js");
const { required } = require("joi");
const schema = mongoose.Schema;

const listingSchema = new schema({
        title: {
                type: String,
                required: true
        },
        description: String,
        image: {
                url: String,
                filename: String
        },
        price: Number,
        location: String,
        country: String,
        tag: String,
        review: [
                {
                        type: schema.Types.ObjectId,
                        ref: "Review"
                }
        ],
        owner: {
                type: schema.Types.ObjectId,
                ref: "User"
        },
        geometry: {
                type: {
                        type: String, // Don't do `{ location: { type: String } }`
                        enum: ['Point'], // 'location.type' must be 'Point'
                        required: true
                },
                coordinates: {
                        type: [Number],
                        required: true
                }
        },
        capacity: {
                type: Number,
                required: true,
                min: 1
        },
        exactLocation: {
                type: String,
                required: true
        },
        rooms: [
                {
                        roomNo: {
                                type: Number,
                                required: true
                        },
                        roomType: {
                                type: String,
                                enum: [
                                        "Suite Bedroom",
                                        "Premium Bedroom",
                                        "Normal Bedroom",
                                        "Master Bedroom",
                                        "Kids Bedroom",
                                        "Guest Room",
                                        "Dormitory"
                                ],
                                required: true
                        },
                        capacity: {
                                type: Number,
                                required: true,
                                min: 1
                        }
                }
        ]

})


const listing = mongoose.model("listing", listingSchema);

module.exports = listing;
