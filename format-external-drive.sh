#!/bin/bash

# Script to format external 3.6TB drive
# WARNING: This will erase ALL data on the drive!

echo "=== External Drive Formatting Script ==="
echo "WARNING: This will completely erase ALL data on your 3.6TB external drive!"
echo "Make sure you have backed up any important data before proceeding."
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "Please don't run this script as root. Run it as your regular user."
    exit 1
fi

# Check if drive exists
if [ ! -b /dev/sda1 ]; then
    echo "Error: /dev/sda1 not found. Please check if your external drive is connected."
    exit 1
fi

# Show current drive info
echo "Current drive information:"
lsblk /dev/sda
echo ""

# Final confirmation
echo "You are about to format: /dev/sda1 (3.6TB external drive)"
echo "This action CANNOT be undone!"
echo ""
read -p "Are you absolutely sure you want to continue? Type 'YES' to confirm: " -r
if [[ ! $REPLY == "YES" ]]; then
    echo "Formatting cancelled."
    exit 0
fi

echo ""
echo "Starting format process..."

# Unmount if mounted
echo "Unmounting drive if currently mounted..."
sudo umount /dev/sda1 2>/dev/null || true

# Create new partition table and partition
echo "Creating new partition table..."
sudo parted /dev/sda --script mklabel gpt

echo "Creating new partition..."
sudo parted /dev/sda --script mkpart primary ext4 0% 100%

# Wait a moment for partition to be created
sleep 2

# Format the partition
echo "Formatting partition with ext4 file system..."
sudo mkfs.ext4 -F /dev/sda1

# Set a label for the drive
echo "Setting drive label..."
sudo e2label /dev/sda1 "External-Drive"

echo ""
echo "✅ Formatting complete!"
echo ""

# Now mount the newly formatted drive
echo "Mounting the newly formatted drive..."
sudo mkdir -p /media/external-drive
sudo mount /dev/sda1 /media/external-drive

# Set proper permissions
echo "Setting permissions..."
sudo chown -R $USER:$USER /media/external-drive
sudo chmod 755 /media/external-drive

# Set up auto-mount
echo "Setting up auto-mount on boot..."
UUID=$(sudo blkid -s UUID -o value /dev/sda1)
if [ -n "$UUID" ]; then
    FSTAB_ENTRY="UUID=$UUID /media/external-drive ext4 defaults,uid=$(id -u),gid=$(id -g),umask=0022,auto,rw 0 2"
    
    # Remove any existing entries for this mount point
    sudo sed -i '/\/media\/external-drive/d' /etc/fstab
    
    # Add new entry
    echo "$FSTAB_ENTRY" | sudo tee -a /etc/fstab
    echo "✅ Auto-mount configured!"
fi

# Show final information
echo ""
echo "=== Format Complete! ==="
echo "Drive information:"
df -h /media/external-drive
echo ""
echo "Your external drive is now:"
echo "✅ Formatted with ext4 file system"
echo "✅ Mounted at /media/external-drive"
echo "✅ Accessible in your file manager"
echo "✅ Set to auto-mount on boot"
echo ""
echo "You can now use it like any other folder!"
echo "Location: /media/external-drive"
