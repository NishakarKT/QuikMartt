import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";
// contexts
import UserContext from "../../contexts/UserContext";
// constants
import { COMPANY } from "../../constants/variables";
import { WISHLIST_ROUTE, HOME_ROUTE, AUTH_USER_ROUTE } from "../../constants/routes";
import {
  PRODUCT_EMPTY_CART_ENDPOINT,
  PRODUCT_REMOVE_FROM_CART_ENDPOINT,
  PRODUCT_CART_TO_WISHLIST_ENDPOINT,
  PRODUCT_NEW_ORDERS_ENDPOINT,
  USER_ENDPOINT,
} from "../../constants/endpoints";
// mui
import {
  Box,
  Stack,
  Button,
  Pagination,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  TextField,
} from "@mui/material";
import { CheckCircle, Cancel, AddCircle } from "@mui/icons-material";
//  variables
const ITEMS_PER_PAGE = 8;
const COIN_FACTOR = 0.05;

const Cart = () => {
  const navigate = useNavigate();
  const { user, setUser, setWishlist, cart, setCart, setOrders } = useContext(UserContext);
  const [orderPage, setOrderPage] = useState(1);
  const [cartPage, setCartPage] = useState(1);
  const [order, setOrder] = useState([]);

  useEffect(() => {
    if (!user) navigate(AUTH_USER_ROUTE);
  }, [user, navigate]);

  const generateQuikCoins = (total) => total * COIN_FACTOR;

  const handleOrderPage = (page) => {
    setOrderPage(page);
    setTimeout(() => window.scrollTo(0, 0), 0);
  };

  const handleCartPage = (page) => {
    setCartPage(page);
    setTimeout(() => window.scrollTo(0, 0), 0);
  };

  const placeOrder = () => {
    const orders = {};
    order.forEach((product) => {
      const data = {
        _id: product._id,
        title: product.title,
        desc: product.desc,
        price: product.price,
        currency: product.currency,
        quantity: product.quantity,
      };
      if (!orders[product.owner]) orders[product.owner] = [data];
      else orders[product.owner].push(data);
    });
    const finalOrders = Object.keys(orders).map((owner) => ({
      from: user._id,
      fromName: user.name,
      to: owner,
      toName: order.find((product) => product.owner === owner)?.ownerName,
      status: "pending",
      products: orders[owner],
    }));
    try {
      axios
        .post(PRODUCT_NEW_ORDERS_ENDPOINT, finalOrders)
        .then((res) => {
          setOrders((orders) => [...orders, ...finalOrders.map((order) => ({ ...order, createdAt: new Date().toISOString() }))]);
          // generate QuikCoins
          let total = 0;
          Object.values(orders).forEach((orders) =>
            orders.forEach((order) => (total += (Number(order.quantity) || 0) * (Number(order.price) || 0)))
          );
          const coins = (Number(user.coins) || 0) + generateQuikCoins(total);
          axios
            .patch(USER_ENDPOINT, { _id: user._id, edits: { coins } })
            .then((res) => {
              setUser((user) => ({ ...user, coins }));
              alert("Orders have been placed! You earned " + coins + " coins");
              clearOrder();
            })
            .catch((err) => {
              alert("Orders have been placed!");
              clearOrder();
            });
        })
        .catch((err) => console.log(err));
    } catch (err) {
      console.log(err);
    }
  };

  const handleQuanitity = (e, product) => {
    setOrder((order) => {
      const idx = order.findIndex((prod) => prod._id === product._id);
      if (idx !== -1) order[idx] = { ...order[idx], quantity: e.target.value };
      return order;
    });
  };

  const handleOrder = (product) => {
    setOrder((order) => {
      if (order.findIndex((prod) => prod._id === product._id) === -1) return [...order, { ...product, quantity: 1 }];
      else return order;
    });
    window.scrollTo(0, 0);
  };

  const handleOrders = () => {
    setOrder(cart.filter((product) => product.availability === "true").map((product) => ({ ...product, quantity: 1 })));
    window.scrollTo(0, 0);
  };

  const clearOrder = () => {
    setOrder([]);
    window.scrollTo(0, 0);
  };

  const clearCart = () => {
    try {
      axios
        .patch(PRODUCT_EMPTY_CART_ENDPOINT, { userId: user._id })
        .then((res) => setCart([]))
        .catch((err) => console.log(err));
    } catch (err) {
      console.log(err);
    }
  };

  const moveToWishlist = () => {
    try {
      axios
        .patch(PRODUCT_CART_TO_WISHLIST_ENDPOINT, { userId: user._id })
        .then((res) => {
          setWishlist((wishlist) => [...wishlist, ...cart]);
          setCart([]);
          navigate(WISHLIST_ROUTE);
        })
        .catch((err) => console.log(err));
    } catch (err) {
      console.log(err);
    }
  };

  const handleRemove = (product) => {
    try {
      try {
        axios
          .patch(PRODUCT_REMOVE_FROM_CART_ENDPOINT, { userId: user._id, productId: product._id })
          .then((res) => {
            setCart(cart.filter((prod) => prod._id !== product._id));
            alert(product.title + " removed from cart!");
            window.scrollTo(0, 0);
          })
          .catch((err) => console.log(err));
      } catch (err) {
        console.log(err);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <Helmet>
        <title>Cart | {COMPANY}</title>
      </Helmet>
      {user ? (
        <Box p={2}>
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography component="h2" variant="h5">
              My Order
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" color="error" onClick={() => clearOrder()}>
                Empty Order
              </Button>
              <Button disabled={!order.length} variant="contained" onClick={() => placeOrder()}>
                Place Order
              </Button>
            </Stack>
          </Stack>
          {order.length ? (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">Sl No.</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="center">Price</TableCell>
                      <TableCell align="center">Currency</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="center">Remove</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.slice((orderPage - 1) * ITEMS_PER_PAGE, orderPage * ITEMS_PER_PAGE).map((product, index) => (
                      <TableRow key={product._id} sx={{ "& > *": { borderBottom: "unset" } }}>
                        <TableCell align="center">{index + 1}</TableCell>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell align="center">{product.price}</TableCell>
                        <TableCell align="center">{product.currency}</TableCell>
                        <TableCell align="center">
                          <TextField
                            onChange={(e) => handleQuanitity(e, product)}
                            variant="standard"
                            label="Quantity"
                            defaultValue={1}
                            type="number"
                            inputProps={{ min: 1 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Cancel
                            sx={{ cursor: "pointer" }}
                            onClick={() => setOrder((order) => order.filter((prod) => prod._id !== product._id))}
                            color="error"
                            fontSize="large"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Pagination
                sx={{ display: "block", width: "fit-content", margin: "24px auto" }}
                onChange={(e, value) => handleOrderPage(value)}
                count={Math.ceil((order.length || 1) / ITEMS_PER_PAGE)}
                color="primary"
              />
            </>
          ) : (
            <Stack py={4} spacing={2} alignItems="center" justifyContent="center">
              <Typography color="text.secondary" component="p" variant="h4" align="center">
                No Order Yet!
              </Typography>
              <Typography color="text.secondary" component="p" variant="body1" align="center">
                You haven't careted any order. Add one from the cart!
              </Typography>
            </Stack>
          )}
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography component="h2" variant="h5">
              My Cart
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" color="error" onClick={() => clearCart()}>
                Empty Cart
              </Button>
              <Button variant="outlined" onClick={() => moveToWishlist(cart)}>
                Move To Wishlist
              </Button>
              <Button variant="contained" onClick={() => handleOrders()}>
                Add to Order
              </Button>
            </Stack>
          </Stack>
          {cart.length ? (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">Sl No.</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="center">Price</TableCell>
                      <TableCell align="center">Currency</TableCell>
                      <TableCell align="center">Availability</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.slice((cartPage - 1) * ITEMS_PER_PAGE, cartPage * ITEMS_PER_PAGE).map((product, index) => (
                      <TableRow key={product._id} sx={{ "& > *": { borderBottom: "unset" } }}>
                        <TableCell align="center">{index + 1}</TableCell>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell align="center">{product.price}</TableCell>
                        <TableCell align="center">{product.currency}</TableCell>
                        <TableCell align="center">
                          {product.availability === "true" ? <CheckCircle color="success" /> : <Cancel color="error" />}
                        </TableCell>
                        <TableCell align="center">
                          <Stack spacing={1} direction="row" justifyContent="center" alignItems="center">
                            <AddCircle color="success" fontSize="large" sx={{ cursor: "pointer" }} onClick={() => handleOrder(product)} />
                            <Cancel fontSize="large" sx={{ cursor: "pointer" }} onClick={() => handleRemove(product)} color="error" />
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Pagination
                sx={{ display: "block", width: "fit-content", margin: "24px auto" }}
                onChange={(e, value) => handleCartPage(value)}
                count={Math.ceil((cart.length || 1) / ITEMS_PER_PAGE)}
                color="primary"
              />
            </>
          ) : (
            <Stack py={4} spacing={2} alignItems="center" justifyContent="center">
              <Typography color="text.secondary" component="p" variant="h4" align="center">
                An Empty Cart!
              </Typography>
              <Typography color="text.secondary" component="p" variant="body1" align="center">
                You haven't added any products/services to your cart. Add one today!
              </Typography>
              <Button onClick={() => navigate(HOME_ROUTE)} sx={{ width: "fit-content" }} variant="contained">
                Explore Products
              </Button>
            </Stack>
          )}
        </Box>
      ) : null}
    </>
  );
};

export default Cart;
