const express = require('express')
const multer = require('multer')
const User = require('../../models/User')
const { isLoggedIn } = require('../../middleware/auth')
const router = express.Router()

/** 
 * Uploads an avatar file
 */
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

/** 
 * Get all users within a specific distance.
 * TODO: Change this to a post so we can input a distance.
 * @example
 * GET /api/users/search?lat=20&lon=-60
 * GET /api/users/search?lat=20&lon=-60&maxDist=100
 * */
router.get('/search', (req, res, next) => {
    const lat = req.query.lat || 25.756365
    const lon = req.query.lon || -80.375716
    const maxDist = req.query.maxDist || 32186.9 // 20 miles

    console.log(`Searching for users near ${lat}, ${lon} within ${maxDist} meters`)
    User.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lon, lat]
                    },
                    $maxDistance: maxDist
                }
            }
        })
        .then(users => {
            res.json(users)
        })
        .catch(err => next(err))
})

/** 
 * Obtains a copy of the current logged in user model
 * @example
 * GET /api/users/me
 */
router.get(`/me`, async(req, res) => {
    res.send(req.user)
})

/** 
 * Edits fields of the currently logged in user
 * @example
 * PATCH /api/users/me 
 */
router.patch(`/me`, async(req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) return res.status(400).send({ error: 'Invalid updates!' })

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

/** 
 * Upload an avatar and save to the user document
 * @example
 * POST /api/users/me/avatar "avatar.jpg"
 */
router.post(`/me/avatar`, upload.single('avatar'), async(req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

/** 
 * Get a user's avatar and send back the image
 * @example
 * GET /api/users/:id/avatar 
 */
router.get(`/:id/avatar`, async(req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) throw new Error()
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

/** 
 * Delete the current user's avatar
 * @example
 * DELETE /api/users/me/avatar
 */
router.delete(`/me/avatar`, async(req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

module.exports = router