const Joi = require('joi');

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),

        description: Joi.string().required(),

        price: Joi.number().min(0).required(),

        location: Joi.string().required(),

        country: Joi.string().required(),

        tag: Joi.string().required(),

        checkboxAMFET: Joi.array().items(Joi.string()).optional(),

        image: Joi.object({
            url: Joi.string().uri().optional(),
        }).optional(),

        capacity: Joi.number().min(1).required(),

        exactLocation: Joi.string().uri().required(),

        rooms: Joi.array().items(
            Joi.object({
                roomNo: Joi.number().required(),

                roomType: Joi.string()
                    .valid(
                        "Suite Bedroom",
                        "Premium Bedroom",
                        "Normal Bedroom",
                        "Master Bedroom",
                        "Kids Bedroom",
                        "Guest Room",
                        "Dormitory"
                    )
                    .required(),

                capacity: Joi.number()
                    .min(1)
                    .required()
            })
        ).min(1).required()

    }).required()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required(),
    }).required()
})



