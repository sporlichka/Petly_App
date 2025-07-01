# 🧪 How to Test Extension Modal

## ✅ **Quick Test Steps**

### **1. Requirements**
- Make sure you have at least one pet in the app
- Open the app in development mode (`__DEV__ = true`)

### **2. Test the Modal UI**
1. Go to **Settings**
2. Find the development section (only visible in dev mode)
3. Tap **"📋 Test Extension Modal"**
4. Restart the app
5. The modal should appear automatically

### **3. Test Different Pets**
1. In Settings, tap **"🐾 Test with Pet Selection"**
2. Choose a pet from the list
3. Restart the app
4. See the modal with the selected pet's information

### **4. Check Modal Queue**
- **"🔍 Debug Extension Modals"** - View all scheduled modals
- **"✅ Check Extension Modals"** - Check which modals are ready to show

## 🎨 **UI Features to Test**

### **Modal Design**
- ✅ Category icon and color (🥣/🩺/🎾)
- ✅ Activity title and category name
- ✅ Extension period text (7 days, 28 days, 90 days)
- ✅ Benefits section explaining what happens when extended

### **Button Behavior**
- ✅ Both buttons are the same size
- ✅ No blue square next to "Extend" button
- ✅ "No, thanks" button dismisses the modal
- ✅ "Extend" button shows loading state and creates activities

### **Text Language**
- ✅ All text is in English
- ✅ Error messages are in English
- ✅ Success messages are in English

## 🔧 **Testing Different Scenarios**

### **Success Cases**
- Extend with existing pet ✅
- Create new activities ✅
- Schedule new notifications ✅
- Plan next extension reminder ✅

### **Error Cases**
- Pet not found (shows proper error message)
- Network issues (shows network error)
- API failures (shows generic error)

## 🚀 **Production Testing**

### **Enable Test Mode**
1. In Settings, toggle **"Test Mode (Dev Only)"** ON
2. Extension reminders will come in 2 minutes instead of days
3. Perfect for quick testing!

### **Create Real Activity**
1. Create an activity with repeat (daily/weekly/monthly)
2. Wait for the extension reminder (2 minutes in test mode)
3. Tap the notification or restart the app
4. Test the full extension flow

## ✨ **Expected Behavior**

**When "Extend" is pressed:**
- Modal shows loading state
- New activities are created in the background
- Success message shows number of activities and notifications
- Modal closes automatically
- Next extension reminder is scheduled

**When "No, thanks" is pressed:**
- Modal closes immediately
- No new activities are created
- Modal is removed from queue

## 🎉 **You're Ready!**

The extension modal system is fully functional with:
- Beautiful English UI
- Equal-sized buttons without visual artifacts
- Comprehensive error handling
- Seamless user experience

Test it out and enjoy the smooth extension flow! 🚀 