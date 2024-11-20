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

// Function to display cart items
function displayCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');

    if (!cartItemsContainer || !cartTotalElement) {
        return; // Exit if not on the cart page
    }

    cartItemsContainer.innerHTML = ''; // Clear existing items

    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');

        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h3>${item.name}</h3>
                <p>Price: $${item.price.toFixed(2)}</p>
                <div class="quantity-control">
                    <button class="decrease-qty" data-index="${index}">-</button>
                    <span>${item.quantity}</span>
                    <button class="increase-qty" data-index="${index}">+</button>
                </div>
                <p>Subtotal: $${itemTotal.toFixed(2)}</p>
                <button class="remove-item" data-index="${index}">Remove</button>
            </div>
        `;

        cartItemsContainer.appendChild(cartItem);
    });

    cartTotalElement.textContent = total.toFixed(2);

    // Add event listeners for quantity controls and remove buttons
    const decreaseButtons = document.querySelectorAll('.decrease-qty');
    const increaseButtons = document.querySelectorAll('.increase-qty');
    const removeButtons = document.querySelectorAll('.remove-item');

    decreaseButtons.forEach(button => {
        button.addEventListener('click', decreaseQuantity);
    });

    increaseButtons.forEach(button => {
        button.addEventListener('click', increaseQuantity);
    });

    removeButtons.forEach(button => {
        button.addEventListener('click', removeItem);
    });
}

// Function to decrease item quantity
function decreaseQuantity(event) {
    const index = event.target.getAttribute('data-index');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
    } else {
        cart.splice(index, 1); // Remove item if quantity is 1
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    displayCartItems();
}

// Function to increase item quantity
function increaseQuantity(event) {
    const index = event.target.getAttribute('data-index');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    cart[index].quantity += 1;

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    displayCartItems();
}

// Function to remove item from cart
function removeItem(event) {
    const index = event.target.getAttribute('data-index');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    cart.splice(index, 1);

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    displayCartItems();
}

// Function to handle checkout
function proceedToCheckout() {
    alert('Proceeding to checkout...');
    // Implement checkout functionality or redirect to a payment page
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to "Add to Cart" buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    addToCartButtons.forEach(button => {
        button.addEventListener('click', addToCart);
    });

    // Update cart count on page load
    updateCartCount();

    // Display cart items if on cart page
    displayCartItems();

    // Add event listener for checkout button
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', proceedToCheckout);
    }
});
