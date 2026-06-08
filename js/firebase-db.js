// firebase-db.js
// Universal Database Adapter for Smart Library
// Seamlessly toggles between Firebase Firestore and LocalStorage based on config state.

class SmartLibraryDB {
  constructor() {
    this.isFirebase = false;
    this.db = null;
    this.init();
  }

  init() {
    if (window.isFirebaseConfigured && window.isFirebaseConfigured()) {
      try {
        // Firebase scripts must be loaded in index.html via CDN (Compat version)
        if (typeof firebase !== 'undefined') {
          firebase.initializeApp(window.firebaseConfig);
          this.db = firebase.firestore();
          this.isFirebase = true;
          console.log("SmartLibraryDB: Connected to Firebase Firestore.");
        } else {
          console.warn("SmartLibraryDB: Firebase SDK not found. Falling back to LocalStorage.");
        }
      } catch (err) {
        console.error("SmartLibraryDB: Failed to initialize Firebase:", err);
      }
    } else {
      console.log("SmartLibraryDB: Running in Local Database Mode (LocalStorage).");
    }

    // Initialize LocalStorage empty tables if they don't exist
    if (!this.isFirebase) {
      if (!localStorage.getItem('smart_lib_libraries')) {
        localStorage.setItem('smart_lib_libraries', JSON.stringify([]));
      }
      if (!localStorage.getItem('smart_lib_books')) {
        localStorage.setItem('smart_lib_books', JSON.stringify([]));
      }
      if (!localStorage.getItem('smart_lib_members')) {
        localStorage.setItem('smart_lib_members', JSON.stringify([]));
      }
      if (!localStorage.getItem('smart_lib_issues')) {
        localStorage.setItem('smart_lib_issues', JSON.stringify([]));
      }
    }
  }

  // --- HELPER LOCALSTORAGE OPERATIONS ---
  _getLocal(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  _setLocal(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- LIBRARIES ---
  async getLibraries() {
    if (this.isFirebase) {
      const snap = await this.db.collection('libraries').get();
      const libs = [];
      snap.forEach(doc => libs.push({ id: doc.id, ...doc.data() }));
      return libs;
    } else {
      return this._getLocal('smart_lib_libraries');
    }
  }

  async registerLibrary(name, adminUser, adminPassword) {
    const newLib = {
      name: name,
      adminUser: adminUser.trim().toLowerCase(),
      adminPassword: adminPassword, // Plain for demonstration purposes
      createdAt: new Date().toISOString()
    };

    if (this.isFirebase) {
      // Check if admin user already exists globally (just in case) or library name
      const snap = await this.db.collection('libraries')
        .where('adminUser', '==', newLib.adminUser)
        .get();
      if (!snap.empty) {
        throw new Error("Admin username already taken.");
      }
      const docRef = await this.db.collection('libraries').add(newLib);
      return { id: docRef.id, ...newLib };
    } else {
      const libs = this._getLocal('smart_lib_libraries');
      if (libs.some(l => l.adminUser === newLib.adminUser)) {
        throw new Error("Admin username already taken.");
      }
      newLib.id = 'lib_' + Math.random().toString(36).substr(2, 9);
      libs.push(newLib);
      this._setLocal('smart_lib_libraries', libs);
      return newLib;
    }
  }

  // --- LOGIN ---
  async loginUser(libraryId, username, password, role) {
    username = username.trim().toLowerCase();

    if (this.isFirebase) {
      if (role === 'admin') {
        const libDoc = await this.db.collection('libraries').doc(libraryId).get();
        if (!libDoc.exists) throw new Error("Library not found.");
        const libData = libDoc.data();
        if (libData.adminUser === username && libData.adminPassword === password) {
          return {
            id: libDoc.id,
            libraryId: libDoc.id,
            libraryName: libData.name,
            username: libData.adminUser,
            name: "Librarian Admin",
            role: "admin"
          };
        } else {
          throw new Error("Invalid admin credentials.");
        }
      } else {
        // Student Login
        const snap = await this.db.collection('members')
          .where('libraryId', '==', libraryId)
          .where('username', '==', username)
          .get();
        
        if (snap.empty) throw new Error("Student account not found.");
        let memberData = null;
        let memberId = null;
        snap.forEach(doc => {
          memberData = doc.data();
          memberId = doc.id;
        });

        if (memberData.password === password) {
          // Get library details
          const libDoc = await this.db.collection('libraries').doc(libraryId).get();
          return {
            id: memberId,
            libraryId: libraryId,
            libraryName: libDoc.exists ? libDoc.data().name : "Library",
            username: memberData.username,
            name: memberData.name,
            role: "student"
          };
        } else {
          throw new Error("Incorrect password.");
        }
      }
    } else {
      // LocalStorage Mode
      const libs = this._getLocal('smart_lib_libraries');
      const lib = libs.find(l => l.id === libraryId);
      if (!lib) throw new Error("Library not found.");

      if (role === 'admin') {
        if (lib.adminUser === username && lib.adminPassword === password) {
          return {
            id: lib.id,
            libraryId: lib.id,
            libraryName: lib.name,
            username: lib.adminUser,
            name: "Librarian Admin",
            role: "admin"
          };
        } else {
          throw new Error("Invalid admin credentials.");
        }
      } else {
        const members = this._getLocal('smart_lib_members');
        const member = members.find(m => m.libraryId === libraryId && m.username === username);
        if (!member) throw new Error("Student account not found.");
        if (member.password === password) {
          return {
            id: member.id,
            libraryId: libraryId,
            libraryName: lib.name,
            username: member.username,
            name: member.name,
            role: "student"
          };
        } else {
          throw new Error("Incorrect password.");
        }
      }
    }
  }

  // --- BOOKS ---
  async getBooks(libraryId) {
    if (this.isFirebase) {
      const snap = await this.db.collection('books').where('libraryId', '==', libraryId).get();
      const books = [];
      snap.forEach(doc => books.push({ id: doc.id, ...doc.data() }));
      return books;
    } else {
      const books = this._getLocal('smart_lib_books');
      return books.filter(b => b.libraryId === libraryId);
    }
  }

  async addBook(libraryId, bookData) {
    const book = {
      libraryId,
      title: bookData.title.trim(),
      author: bookData.author.trim(),
      genre: bookData.genre.trim(),
      isbn: bookData.isbn.trim(),
      availability: bookData.availability || 'available', // available, issued
      createdAt: new Date().toISOString()
    };

    if (this.isFirebase) {
      const docRef = await this.db.collection('books').add(book);
      return { id: docRef.id, ...book };
    } else {
      const books = this._getLocal('smart_lib_books');
      book.id = 'book_' + Math.random().toString(36).substr(2, 9);
      books.push(book);
      this._setLocal('smart_lib_books', books);
      return book;
    }
  }

  async updateBook(libraryId, bookId, bookData) {
    if (this.isFirebase) {
      await this.db.collection('books').doc(bookId).update(bookData);
      return { id: bookId, ...bookData };
    } else {
      const books = this._getLocal('smart_lib_books');
      const idx = books.findIndex(b => b.id === bookId && b.libraryId === libraryId);
      if (idx !== -1) {
        books[idx] = { ...books[idx], ...bookData };
        this._setLocal('smart_lib_books', books);
        return books[idx];
      }
      throw new Error("Book not found.");
    }
  }

  async deleteBook(libraryId, bookId) {
    if (this.isFirebase) {
      // Also delete any active checkouts? For simplicity, we just delete the book doc.
      await this.db.collection('books').doc(bookId).delete();
      return true;
    } else {
      let books = this._getLocal('smart_lib_books');
      books = books.filter(b => !(b.id === bookId && b.libraryId === libraryId));
      this._setLocal('smart_lib_books', books);
      return true;
    }
  }

  // --- MEMBERS ---
  async getMembers(libraryId) {
    if (this.isFirebase) {
      const snap = await this.db.collection('members').where('libraryId', '==', libraryId).get();
      const members = [];
      snap.forEach(doc => members.push({ id: doc.id, ...doc.data() }));
      return members;
    } else {
      const members = this._getLocal('smart_lib_members');
      return members.filter(m => m.libraryId === libraryId);
    }
  }

  async addMember(libraryId, memberData) {
    const member = {
      libraryId,
      username: memberData.username.trim().toLowerCase(),
      name: memberData.name.trim(),
      email: memberData.email.trim(),
      password: memberData.password,
      createdAt: new Date().toISOString()
    };

    if (this.isFirebase) {
      // Check uniqueness of username in this library
      const snap = await this.db.collection('members')
        .where('libraryId', '==', libraryId)
        .where('username', '==', member.username)
        .get();
      if (!snap.empty) {
        throw new Error("Student username already exists in this library.");
      }
      const docRef = await this.db.collection('members').add(member);
      return { id: docRef.id, ...member };
    } else {
      const members = this._getLocal('smart_lib_members');
      if (members.some(m => m.libraryId === libraryId && m.username === member.username)) {
        throw new Error("Student username already exists in this library.");
      }
      member.id = 'mem_' + Math.random().toString(36).substr(2, 9);
      members.push(member);
      this._setLocal('smart_lib_members', members);
      return member;
    }
  }

  async updateMember(libraryId, memberId, memberData) {
    if (this.isFirebase) {
      await this.db.collection('members').doc(memberId).update(memberData);
      return { id: memberId, ...memberData };
    } else {
      const members = this._getLocal('smart_lib_members');
      const idx = members.findIndex(m => m.id === memberId && m.libraryId === libraryId);
      if (idx !== -1) {
        members[idx] = { ...members[idx], ...memberData };
        this._setLocal('smart_lib_members', members);
        return members[idx];
      }
      throw new Error("Member not found.");
    }
  }

  async deleteMember(libraryId, memberId) {
    if (this.isFirebase) {
      await this.db.collection('members').doc(memberId).delete();
      return true;
    } else {
      let members = this._getLocal('smart_lib_members');
      members = members.filter(m => !(m.id === memberId && m.libraryId === libraryId));
      this._setLocal('smart_lib_members', members);
      return true;
    }
  }

  // --- ISSUES & RETURNS ---
  async getIssues(libraryId) {
    if (this.isFirebase) {
      const snap = await this.db.collection('issues').where('libraryId', '==', libraryId).get();
      const issues = [];
      snap.forEach(doc => issues.push({ id: doc.id, ...doc.data() }));
      return issues;
    } else {
      const issues = this._getLocal('smart_lib_issues');
      return issues.filter(i => i.libraryId === libraryId);
    }
  }

  async issueBook(libraryId, bookId, memberId, durationDays = 14) {
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(issueDate.getDate() + parseInt(durationDays));

    // Get Book and Member details first
    let bookTitle = "";
    let memberName = "";
    let resolvedBookId = bookId.trim();
    let resolvedMemberId = memberId.trim();

    if (this.isFirebase) {
      // 1. Resolve Book
      let bookDoc = await this.db.collection('books').doc(resolvedBookId).get();
      if (!bookDoc.exists) {
        // Fallback: check if it's an ISBN
        const bookSnap = await this.db.collection('books')
          .where('libraryId', '==', libraryId)
          .where('isbn', '==', resolvedBookId)
          .get();
        if (!bookSnap.empty) {
          bookSnap.forEach(doc => {
            bookDoc = doc;
          });
          resolvedBookId = bookDoc.id;
        } else {
          throw new Error("Book not found by ID or ISBN.");
        }
      }

      // 2. Resolve Member
      let memberDoc = await this.db.collection('members').doc(resolvedMemberId).get();
      if (!memberDoc.exists) {
        // Fallback: check if it's a student username
        const memberSnap = await this.db.collection('members')
          .where('libraryId', '==', libraryId)
          .where('username', '==', resolvedMemberId.toLowerCase())
          .get();
        if (!memberSnap.empty) {
          memberSnap.forEach(doc => {
            memberDoc = doc;
          });
          resolvedMemberId = memberDoc.id;
        } else {
          throw new Error("Member not found by ID or Username.");
        }
      }

      if (bookDoc.data().availability !== 'available') throw new Error("Book is already issued.");

      bookTitle = bookDoc.data().title;
      memberName = memberDoc.data().name;

      const newIssue = {
        libraryId,
        bookId: resolvedBookId,
        bookTitle,
        memberId: resolvedMemberId,
        memberName,
        issueDate: issueDate.toISOString(),
        dueDate: dueDate.toISOString(),
        returnDate: null,
        finePaid: 0,
        status: 'issued' // issued, returned
      };

      const docRef = await this.db.collection('issues').add(newIssue);
      // Update book availability status
      await this.db.collection('books').doc(resolvedBookId).update({ availability: 'issued' });
      return { id: docRef.id, ...newIssue };
    } else {
      const books = this._getLocal('smart_lib_books');
      const members = this._getLocal('smart_lib_members');
      const issues = this._getLocal('smart_lib_issues');

      let book = books.find(b => b.id === resolvedBookId && b.libraryId === libraryId);
      if (!book) {
        // Resolve by ISBN
        book = books.find(b => b.isbn === resolvedBookId && b.libraryId === libraryId);
        if (book) resolvedBookId = book.id;
      }

      let member = members.find(m => m.id === resolvedMemberId && m.libraryId === libraryId);
      if (!member) {
        // Resolve by username
        member = members.find(m => m.username === resolvedMemberId.toLowerCase() && m.libraryId === libraryId);
        if (member) resolvedMemberId = member.id;
      }

      if (!book) throw new Error("Book not found by ID or ISBN.");
      if (!member) throw new Error("Member not found by ID or Username.");
      if (book.availability !== 'available') throw new Error("Book is already issued.");

      bookTitle = book.title;
      memberName = member.name;

      const newIssue = {
        id: 'issue_' + Math.random().toString(36).substr(2, 9),
        libraryId,
        bookId: resolvedBookId,
        bookTitle,
        memberId: resolvedMemberId,
        memberName,
        issueDate: issueDate.toISOString(),
        dueDate: dueDate.toISOString(),
        returnDate: null,
        finePaid: 0,
        status: 'issued'
      };

      // Update book status
      book.availability = 'issued';
      this._setLocal('smart_lib_books', books);

      issues.push(newIssue);
      this._setLocal('smart_lib_issues', issues);

      return newIssue;
    }
  }

  async returnBook(libraryId, issueId, finePaid = 0) {
    const returnDate = new Date().toISOString();

    if (this.isFirebase) {
      const issueDoc = await this.db.collection('issues').doc(issueId).get();
      if (!issueDoc.exists) throw new Error("Issue log not found.");
      const issueData = issueDoc.data();
      
      // Update issue log
      await this.db.collection('issues').doc(issueId).update({
        returnDate: returnDate,
        status: 'returned',
        finePaid: finePaid
      });

      // Update book status
      await this.db.collection('books').doc(issueData.bookId).update({
        availability: 'available'
      });

      return { id: issueId, ...issueData, returnDate, status: 'returned', finePaid };
    } else {
      const issues = this._getLocal('smart_lib_issues');
      const books = this._getLocal('smart_lib_books');

      const issue = issues.find(i => i.id === issueId && i.libraryId === libraryId);
      if (!issue) throw new Error("Issue log not found.");

      issue.returnDate = returnDate;
      issue.status = 'returned';
      issue.finePaid = finePaid;

      // Update book status
      const book = books.find(b => b.id === issue.bookId && b.libraryId === libraryId);
      if (book) {
        book.availability = 'available';
      }

      this._setLocal('smart_lib_issues', issues);
      this._setLocal('smart_lib_books', books);

      return issue;
    }
  }
}

// Instantiate globally
window.smartLibDB = new SmartLibraryDB();
