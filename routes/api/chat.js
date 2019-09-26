const express = require('express')
const { isLoggedIn } = require('../../middleware/auth')
const Chat = require('../../models/Chat')
const router = express.Router()


/** 
 * Get all posts.
 * @example
 * GET /api/chat
 * */
router.get('/', async(req, res, next) => {
    res.json(await Chat.find())
})

/** 
 * Get specific chat message.
 * @example
 * GET /api/chat/:id
 * */
router.get('/:id', async(req, res, next) => {
    try {
        const chat = await Chat.findById(req.params.id)
        if (!chat) throw new Error()
        res.status(202).json(chat)
    } catch (e) {
        res.status(404).send(e)
    }
})

/**
 * Create a chat.
 * @example 
 * POST /api/chat
 */
router.post('/', isLoggedIn, async(req, res, next) => {
    try {
        let chat = await new Chat(req.body.users).save()
        res.status(201).json(chat)
    } catch (err) {
        next(err)
    }
})

/**
 * Delete a specific chat
 * @example 
 * DELETE /api/chat/:id
 */
router.delete(`/:id`, isLoggedIn, async(req, res) => {
    try {
        const chat = await Chat.findById(req.params.id)
        if (!chat) throw new Error()
        if (!req.user._id.equals(chat.author)) {
            res.status(403).send('You do not have permission to delete this resource.')
            return
        }
        await chat.remove()
        res.status(202).json(chat)
    } catch (e) {
        res.status(404).send(e)
    }
})

module.exports = router