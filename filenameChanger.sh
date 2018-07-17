#!/bin/bash
echo "Changing Filename..."
mv config[template].json config.json
mv ownOpenOrders[template].json ownOpenOrders.json
mv submitOrderHistory[template].json submitOrderHistory.json
echo "Finished."
exit 0