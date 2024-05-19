const Hapi = require("@hapi/hapi");
const { nanoid } = require("nanoid");

const init = async () => {
  const server = Hapi.server({
    port: 9000,
    host: "localhost",
  });

  let books = [];

  const validateBookData = (bookData) => {
    const { name, pageCount, readPage } = bookData;
    if (!name) {
      throw new Error("Gagal menambahkan buku. Mohon isi nama buku");
    }
    if (readPage > pageCount) {
      throw new Error(
        "Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount"
      );
    }
  };

  const findBookById = (bookId) => {
    const bookIndex = books.findIndex((book) => book.id === bookId);
    if (bookIndex === -1) {
      throw new Error("Buku tidak ditemukan");
    }
    return bookIndex;
  };

  server.route({
    method: "POST",
    path: "/books",
    handler: (request, h) => {
      try {
        const bookData = request.payload;
        validateBookData(bookData);
        const bookId = nanoid();
        const insertedAt = new Date().toISOString();
        const updatedAt = insertedAt;
        const finished = bookData.pageCount === bookData.readPage;
        const newBook = {
          id: bookId,
          insertedAt,
          updatedAt,
          finished,
          ...bookData,
        };
        books.push(newBook);
        return h
          .response({
            status: "success",
            message: "Buku berhasil ditambahkan",
            data: { bookId },
          })
          .code(201);
      } catch (error) {
        return h.response({ status: "fail", message: error.message }).code(400);
      }
    },
  });

  server.route({
    method: "GET",
    path: "/books",
    handler: (request, h) => {
      const formattedBooks = books.map((book) => ({
        id: book.id,
        name: book.name,
        publisher: book.publisher,
      }));
      return h.response({ status: "success", data: { books: formattedBooks } });
    },
  });

  server.route({
    method: "GET",
    path: "/books/{bookId}",
    handler: (request, h) => {
      try {
        const bookIndex = findBookById(request.params.bookId);
        const book = books[bookIndex];
        return h.response({ status: "success", data: { book } });
      } catch (error) {
        return h.response({ status: "fail", message: error.message }).code(404);
      }
    },
  });

  server.route({
    method: "PUT",
    path: "/books/{bookId}",
    handler: (request, h) => {
      try {
        const bookId = request.params.bookId;
        const bookIndex = findBookById(bookId);
        const {
          name,
          pageCount,
          readPage,
          year,
          author,
          summary,
          publisher,
          reading,
        } = request.payload;
  
        if (bookIndex === -1) {
          return h.response({
            status: "fail",
            message: "Gagal memperbarui buku. Id tidak ditemukan",
          }).code(400);
        }
        
        if (!name) {
          return h.response({
            status: "fail",
            message: "Gagal memperbarui buku. Mohon isi nama buku",
          }).code(400);
        }        
  
        if (readPage > pageCount) {
          return h.response({
            status: "fail",
            message: "Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount",
          }).code(400);
        }        
  
        const updatedAt = new Date().toISOString();
        const finished = pageCount === readPage;
        books[bookIndex] = {
          ...books[bookIndex],
          name,
          pageCount,
          readPage,
          year,
          author,
          summary,
          publisher,
          reading,
          updatedAt,
          finished,
        };
  
        return h.response({
          status: "success",
          message: "Buku berhasil diperbarui",
          data: books[bookIndex], 
        }).code(200); 
      } catch (error) {
        return h.response({ status: "fail", message: "Gagal memperbarui buku. Id tidak ditemukan" }).code(404);
      }
    },
  });  
  
  server.route({
    method: "DELETE",
    path: "/books/{bookId}",
    handler: (request, h) => {
      try {
        const bookIndex = findBookById(request.params.bookId);
        books.splice(bookIndex, 1);
        return h.response({
          status: "success",
          message: "Buku berhasil dihapus",
        });
      } catch (error) {
        return h
          .response({
            status: "fail",
            message: "Buku gagal dihapus. Id tidak ditemukan",
          })
          .code(404);
      }
    },
  });

  await server.start();
  console.log("Server is running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
