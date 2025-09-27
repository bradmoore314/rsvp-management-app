#!/bin/bash

# Script to mount external 3.6TB drive and make it accessible like a regular folder
# Run this script on your Surface device (not in container)

echo "=== External Drive Mounting Script ==="
echo "This script will mount your 3.6TB external drive and make it accessible in your file manager"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "Please don't run this script as root. Run it as your regular user."
    exit 1
fi

# Create mount point
echo "Creating mount point directory..."
sudo mkdir -p /media/external-drive

# Check if drive exists
if [ ! -b /dev/sda1 ]; then
    echo "Error: /dev/sda1 not found. Please check if your external drive is connected."
    exit 1
fi

# Check file system type
echo "Checking file system type..."
FS_TYPE=$(sudo file -s /dev/sda1 | grep -o 'NTFS\|ext4\|exFAT\|FAT32' | head -1)

if [ -z "$FS_TYPE" ]; then
    echo "Could not determine file system type. Trying common formats..."
    FS_TYPE="unknown"
fi

echo "Detected file system: $FS_TYPE"

# Mount the drive based on file system type
echo "Mounting drive..."
case $FS_TYPE in
    "NTFS")
        echo "Mounting NTFS drive..."
        sudo mount -t ntfs-3g /dev/sda1 /media/external-drive
        ;;
    "ext4")
        echo "Mounting ext4 drive..."
        sudo mount /dev/sda1 /media/external-drive
        ;;
    "exFAT")
        echo "Mounting exFAT drive..."
        sudo mount -t exfat /dev/sda1 /media/external-drive
        ;;
    "FAT32")
        echo "Mounting FAT32 drive..."
        sudo mount -t vfat /dev/sda1 /media/external-drive
        ;;
    *)
        echo "Unknown file system. Trying auto-detect..."
        sudo mount /dev/sda1 /media/external-drive
        ;;
esac

# Check if mount was successful
if mountpoint -q /media/external-drive; then
    echo "✅ Drive mounted successfully!"
    
    # Set proper permissions
    echo "Setting permissions..."
    sudo chown -R $USER:$USER /media/external-drive
    sudo chmod 755 /media/external-drive
    
    # Get drive info
    echo ""
    echo "=== Drive Information ==="
    df -h /media/external-drive
    echo ""
    echo "Drive is now accessible at: /media/external-drive"
    echo "You can access it through your file manager or by navigating to that folder."
    
    # Ask if user wants to make it permanent
    echo ""
    read -p "Do you want to make this drive auto-mount on boot? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Setting up auto-mount..."
        
        # Get UUID
        UUID=$(sudo blkid -s UUID -o value /dev/sda1)
        if [ -n "$UUID" ]; then
            # Create fstab entry
            FSTAB_ENTRY="UUID=$UUID /media/external-drive ntfs-3g defaults,uid=$(id -u),gid=$(id -g),umask=0022,sync,auto,rw 0 0"
            
            # Check if entry already exists
            if ! grep -q "$UUID" /etc/fstab; then
                echo "$FSTAB_ENTRY" | sudo tee -a /etc/fstab
                echo "✅ Auto-mount configured! The drive will now mount automatically on boot."
            else
                echo "Auto-mount entry already exists in /etc/fstab"
            fi
        else
            echo "Could not get UUID for auto-mount setup"
        fi
    fi
    
    echo ""
    echo "=== Setup Complete! ==="
    echo "Your external drive is now mounted and accessible."
    echo "Location: /media/external-drive"
    echo "You can now access it like any other folder in your file manager."
    
else
    echo "❌ Failed to mount drive. Please check the error messages above."
    echo "Common issues:"
    echo "- Drive might be in use by another process"
    echo "- File system might be corrupted"
    echo "- Drive might need to be formatted"
    exit 1
fi
