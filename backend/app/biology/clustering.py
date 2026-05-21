import numpy as np
from sklearn.cluster import KMeans


def kmeans_cluster(embedding: np.ndarray, n_clusters: int = 8) -> np.ndarray:
    n_clusters = min(n_clusters, embedding.shape[0])
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init="auto")
    return kmeans.fit_predict(embedding).astype(int)
