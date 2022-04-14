'use strict';
const stripe = require('stripe')(process.env.STRIPE_SK);

const { createCoreController } = require('@strapi/strapi').factories;

/**
 * Given a dollar amount, return the amount in cents
 * @param {number} number 
 * @returns 
 */
const fromDecimalToInt = (number) => parseInt(number * 100);


/**
 *  order controller
 */

module.exports = createCoreController('api::order.order', ({ strapi }) =>  ({

    /**
     * Create an order and sets up the Stripe Checkout Session for the frontend 
     * @param {any} ctx
     */
    async create(ctx) {
        const { product } = ctx.request.body

        if(!product) {
            return ctx.throw(400, 'Please specify a product')
        }

        const realProduct = await strapi.services.product.findOne({ id: product.data.id })
        if(!realProduct) {
            return ctx.throw(404, 'No product with such id')
        }

        const { user } = ctx.session.user

        const BASE_URL = ctx.request.headers.origin || 'http://localhost:3000'

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: user.email,
            mode: 'payment',
            success_url: `${BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: BASE_URL,
            line_items: [
                {
                    price_data: {
                        currency: 'nzd',
                        product_data: {
                            name: realProduct.data.attributes.name
                        },
                        unit_amount: fromDecimalToInt(realProduct.data.attributes.price)
                    },
                    quantity: 1
                }
            ]
        })

        //create the order
        const newOrder = await super.strapi.services.order.create({
            /*user: user.id,*/
            product: realProduct.data.id,
            total: realProduct.data.attributes.price,
            status: 'unpaid',
            checkout_session: session.id
        })

        return { id: session.id }
    }

}))


