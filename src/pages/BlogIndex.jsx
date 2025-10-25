import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import posts from "../data/BlogPosts.js";

export default function BlogIndex() {
  return (
    <div className="container py-4">
      <header className="mb-4 text-center">
        <h1 className="display-6 fw-bold">Blog de Pastelería</h1>
        <p className="text-muted">
          Ideas, técnicas y recetas probadas para elevar tus postres en casa.
        </p>
      </header>

      <div className="row g-4">
        {posts.map((p) => (
          <div className="col-12 col-md-6" key={p.slug}>
            <div className="card h-100 shadow-sm">
              <img src={p.image} className="card-img-top" alt={p.title} />
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between mb-1">
                  <span className="badge bg-primary">{p.tag}</span>
                  <small className="text-muted">
                    {new Date(p.date).toLocaleDateString()} · {p.readTime}
                  </small>
                </div>
                <h2 className="h5">{p.title}</h2>
                <p className="text-muted flex-grow-1">{p.excerpt}</p>
                <div className="d-grid">
                  <Link className="btn btn-dark" to={p.slug}>
                    Leer artículo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
