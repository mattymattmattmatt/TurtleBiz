// cart.js

// Function to add item to cart
function addToCart(event) {
    const button = event.target;
    const product = button.closest('.product');
    const name = button.getAttribute('data-name');
    const price = parseFloat(button.getAttribute('data-price'));
    const image = button.getAttribute('data-image');

    const cartItem = {
        name: name,
        price: price,
        image: image,
        quantity: 1
    };

    // Get existing cart from Local Storage or initialize empty array
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => item.name === name);

    if (existingItemIndex >= 0) {
        // Item exists, increase quantity
        cart[existingItemIndex].quantity += 1;
    } else {
        // Add new item to cart
        cart.push(cartItem);
    }

    // Save updated cart to Local Storage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Update cart count in navigation
    updateCartCount();
}

// Function to update cart item count in navigation
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');

    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
}

// Add event listeners to "Add to Cart" buttons
document.addEventListener('DOMContentLoaded', () => {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    addToCartButtons.forEach(button => {
        button.addEventListener('click', addToCart);
    });

    // Update cart count on page load
    updateCartCount();
});
