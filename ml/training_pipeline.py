# Machine Learning Training Pipeline

import os
import json
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import joblib
import pickle
from pathlib import Path

# ML Libraries
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
import xgboost as xgb
import lightgbm as lgb

# Deep Learning
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import Dense, LSTM, GRU, Embedding, Dropout, BatchNormalization
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

# NLP Libraries
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import spacy

# Time Series
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import adfuller
import prophet

# Computer Vision
import cv2
from PIL import Image
import torch
import torchvision.transforms as transforms
from torchvision.models import resnet50, efficientnet_b0

# Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLTrainingPipeline:
    """Comprehensive ML training pipeline for reconciliation platform"""
    
    def __init__(self, config_path: str = "ml_config.json"):
        self.config = self.load_config(config_path)
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.vectorizers = {}
        self.training_data = {}
        self.metrics = {}
        
        # Initialize components
        self.setup_nlp()
        self.setup_gpu()
        
    def load_config(self, config_path: str) -> Dict[str, Any]:
        """Load ML configuration"""
        default_config = {
            "data_paths": {
                "training": "data/training/",
                "validation": "data/validation/",
                "models": "models/",
                "logs": "logs/ml/"
            },
            "models": {
                "classification": {
                    "algorithms": ["random_forest", "xgboost", "lightgbm", "neural_network"],
                    "hyperparameters": {
                        "random_forest": {"n_estimators": 100, "max_depth": 10},
                        "xgboost": {"n_estimators": 100, "max_depth": 6, "learning_rate": 0.1},
                        "lightgbm": {"n_estimators": 100, "max_depth": 6, "learning_rate": 0.1},
                        "neural_network": {"hidden_layers": [128, 64], "dropout": 0.3}
                    }
                },
                "regression": {
                    "algorithms": ["linear_regression", "random_forest", "xgboost"],
                    "hyperparameters": {
                        "linear_regression": {"fit_intercept": True},
                        "random_forest": {"n_estimators": 100, "max_depth": 10},
                        "xgboost": {"n_estimators": 100, "max_depth": 6, "learning_rate": 0.1}
                    }
                },
                "time_series": {
                    "algorithms": ["arima", "prophet", "lstm"],
                    "hyperparameters": {
                        "arima": {"order": (1, 1, 1)},
                        "prophet": {"seasonality_mode": "multiplicative"},
                        "lstm": {"units": 50, "dropout": 0.2}
                    }
                },
                "nlp": {
                    "algorithms": ["tfidf", "word2vec", "bert"],
                    "hyperparameters": {
                        "tfidf": {"max_features": 10000, "ngram_range": (1, 2)},
                        "word2vec": {"vector_size": 100, "window": 5},
                        "bert": {"model_name": "bert-base-uncased"}
                    }
                },
                "computer_vision": {
                    "algorithms": ["resnet", "efficientnet", "custom_cnn"],
                    "hyperparameters": {
                        "resnet": {"pretrained": True, "num_classes": 10},
                        "efficientnet": {"pretrained": True, "num_classes": 10},
                        "custom_cnn": {"filters": [32, 64, 128], "kernel_size": 3}
                    }
                }
            },
            "training": {
                "test_size": 0.2,
                "validation_size": 0.1,
                "cross_validation_folds": 5,
                "random_state": 42,
                "early_stopping_patience": 10,
                "batch_size": 32,
                "epochs": 100
            },
            "evaluation": {
                "metrics": ["accuracy", "precision", "recall", "f1", "auc"],
                "threshold": 0.5,
                "confidence_threshold": 0.8
            }
        }
        
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                user_config = json.load(f)
                default_config.update(user_config)
        
        return default_config
    
    def setup_nlp(self):
        """Setup NLP components"""
        try:
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            nltk.download('wordnet', quiet=True)
            self.stop_words = set(stopwords.words('english'))
            self.lemmatizer = WordNetLemmatizer()
        except Exception as e:
            logger.warning(f"NLP setup failed: {e}")
    
    def setup_gpu(self):
        """Setup GPU for training"""
        if tf.config.list_physical_devices('GPU'):
            logger.info("GPU available for training")
            tf.config.experimental.set_memory_growth(tf.config.list_physical_devices('GPU')[0], True)
        else:
            logger.info("No GPU available, using CPU")
    
    def load_training_data(self, data_type: str) -> pd.DataFrame:
        """Load training data for specific ML task"""
        data_path = self.config["data_paths"]["training"]
        
        if data_type == "reconciliation":
            # Load reconciliation data
            data = pd.read_csv(f"{data_path}/reconciliation_data.csv")
            return self.preprocess_reconciliation_data(data)
        
        elif data_type == "anomaly_detection":
            # Load anomaly detection data
            data = pd.read_csv(f"{data_path}/anomaly_data.csv")
            return self.preprocess_anomaly_data(data)
        
        elif data_type == "text_classification":
            # Load text classification data
            data = pd.read_csv(f"{data_path}/text_data.csv")
            return self.preprocess_text_data(data)
        
        elif data_type == "time_series":
            # Load time series data
            data = pd.read_csv(f"{data_path}/time_series_data.csv")
            return self.preprocess_time_series_data(data)
        
        elif data_type == "image_classification":
            # Load image classification data
            data = pd.read_csv(f"{data_path}/image_data.csv")
            return self.preprocess_image_data(data)
        
        else:
            raise ValueError(f"Unknown data type: {data_type}")
    
    def preprocess_reconciliation_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Preprocess reconciliation data for ML training"""
        logger.info("Preprocessing reconciliation data...")
        
        # Handle missing values
        data = data.fillna(data.median())
        
        # Feature engineering
        data['amount_diff'] = data['amount_1'] - data['amount_2']
        data['amount_ratio'] = data['amount_1'] / data['amount_2']
        data['date_diff_days'] = (data['date_1'] - data['date_2']).dt.days
        
        # Categorical encoding
        categorical_columns = ['transaction_type', 'category', 'status']
        for col in categorical_columns:
            if col in data.columns:
                le = LabelEncoder()
                data[f'{col}_encoded'] = le.fit_transform(data[col].astype(str))
                self.encoders[col] = le
        
        # Scale numerical features
        numerical_columns = ['amount_1', 'amount_2', 'amount_diff', 'amount_ratio', 'date_diff_days']
        scaler = StandardScaler()
        data[numerical_columns] = scaler.fit_transform(data[numerical_columns])
        self.scalers['reconciliation'] = scaler
        
        return data
    
    def preprocess_anomaly_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Preprocess anomaly detection data"""
        logger.info("Preprocessing anomaly detection data...")
        
        # Handle missing values
        data = data.fillna(data.median())
        
        # Feature engineering for anomaly detection
        data['amount_zscore'] = (data['amount'] - data['amount'].mean()) / data['amount'].std()
        data['frequency_score'] = data.groupby('user_id')['transaction_id'].transform('count')
        data['time_since_last'] = data.groupby('user_id')['timestamp'].diff().dt.total_seconds()
        
        # Scale features
        scaler = StandardScaler()
        feature_columns = ['amount', 'amount_zscore', 'frequency_score', 'time_since_last']
        data[feature_columns] = scaler.fit_transform(data[feature_columns])
        self.scalers['anomaly'] = scaler
        
        return data
    
    def preprocess_text_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Preprocess text data for NLP tasks"""
        logger.info("Preprocessing text data...")
        
        # Text preprocessing
        def preprocess_text(text):
            if pd.isna(text):
                return ""
            
            # Convert to lowercase
            text = text.lower()
            
            # Remove special characters
            text = re.sub(r'[^a-zA-Z\s]', '', text)
            
            # Tokenize and remove stopwords
            tokens = word_tokenize(text)
            tokens = [token for token in tokens if token not in self.stop_words]
            
            # Lemmatize
            tokens = [self.lemmatizer.lemmatize(token) for token in tokens]
            
            return ' '.join(tokens)
        
        data['processed_text'] = data['text'].apply(preprocess_text)
        
        # TF-IDF vectorization
        vectorizer = TfidfVectorizer(
            max_features=self.config['models']['nlp']['hyperparameters']['tfidf']['max_features'],
            ngram_range=self.config['models']['nlp']['hyperparameters']['tfidf']['ngram_range']
        )
        data['text_features'] = vectorizer.fit_transform(data['processed_text']).toarray()
        self.vectorizers['text'] = vectorizer
        
        return data
    
    def preprocess_time_series_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Preprocess time series data"""
        logger.info("Preprocessing time series data...")
        
        # Ensure datetime index
        data['timestamp'] = pd.to_datetime(data['timestamp'])
        data = data.set_index('timestamp')
        
        # Handle missing values
        data = data.fillna(method='ffill').fillna(method='bfill')
        
        # Feature engineering
        data['hour'] = data.index.hour
        data['day_of_week'] = data.index.dayofweek
        data['month'] = data.index.month
        data['lag_1'] = data['value'].shift(1)
        data['lag_7'] = data['value'].shift(7)
        data['rolling_mean_7'] = data['value'].rolling(window=7).mean()
        data['rolling_std_7'] = data['value'].rolling(window=7).std()
        
        # Remove rows with NaN values
        data = data.dropna()
        
        return data
    
    def preprocess_image_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Preprocess image data for computer vision tasks"""
        logger.info("Preprocessing image data...")
        
        # Image preprocessing pipeline
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        # Load and preprocess images
        processed_images = []
        for image_path in data['image_path']:
            try:
                image = Image.open(image_path).convert('RGB')
                processed_image = transform(image)
                processed_images.append(processed_image.numpy())
            except Exception as e:
                logger.warning(f"Failed to process image {image_path}: {e}")
                processed_images.append(np.zeros((3, 224, 224)))
        
        data['processed_image'] = processed_images
        
        return data
    
    def train_classification_model(self, data: pd.DataFrame, target_column: str) -> Dict[str, Any]:
        """Train classification models"""
        logger.info("Training classification models...")
        
        # Prepare features and target
        feature_columns = [col for col in data.columns if col != target_column]
        X = data[feature_columns]
        y = data[target_column]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=self.config['training']['test_size'],
            random_state=self.config['training']['random_state']
        )
        
        # Train multiple models
        models = {}
        results = {}
        
        for algorithm in self.config['models']['classification']['algorithms']:
            logger.info(f"Training {algorithm}...")
            
            if algorithm == 'random_forest':
                model = RandomForestClassifier(
                    **self.config['models']['classification']['hyperparameters']['random_forest']
                )
            elif algorithm == 'xgboost':
                model = xgb.XGBClassifier(
                    **self.config['models']['classification']['hyperparameters']['xgboost']
                )
            elif algorithm == 'lightgbm':
                model = lgb.LGBMClassifier(
                    **self.config['models']['classification']['hyperparameters']['lightgbm']
                )
            elif algorithm == 'neural_network':
                model = self.create_neural_network(X_train.shape[1], len(np.unique(y)))
            else:
                continue
            
            # Train model
            if algorithm == 'neural_network':
                history = model.fit(
                    X_train, y_train,
                    validation_split=self.config['training']['validation_size'],
                    epochs=self.config['training']['epochs'],
                    batch_size=self.config['training']['batch_size'],
                    callbacks=[
                        EarlyStopping(patience=self.config['training']['early_stopping_patience']),
                        ReduceLROnPlateau(factor=0.5, patience=5)
                    ],
                    verbose=0
                )
                models[algorithm] = model
                results[algorithm] = {
                    'history': history.history,
                    'test_accuracy': model.evaluate(X_test, y_test, verbose=0)[1]
                }
            else:
                model.fit(X_train, y_train)
                models[algorithm] = model
                
                # Evaluate model
                y_pred = model.predict(X_test)
                y_pred_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else None
                
                results[algorithm] = {
                    'accuracy': model.score(X_test, y_test),
                    'classification_report': classification_report(y_test, y_pred),
                    'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
                    'auc': roc_auc_score(y_test, y_pred_proba) if y_pred_proba is not None else None
                }
        
        # Save best model
        best_algorithm = max(results.keys(), key=lambda k: results[k].get('accuracy', results[k].get('test_accuracy', 0)))
        self.models['classification'] = models[best_algorithm]
        
        return {
            'models': models,
            'results': results,
            'best_model': best_algorithm,
            'feature_columns': feature_columns
        }
    
    def train_regression_model(self, data: pd.DataFrame, target_column: str) -> Dict[str, Any]:
        """Train regression models"""
        logger.info("Training regression models...")
        
        # Prepare features and target
        feature_columns = [col for col in data.columns if col != target_column]
        X = data[feature_columns]
        y = data[target_column]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=self.config['training']['test_size'],
            random_state=self.config['training']['random_state']
        )
        
        # Train multiple models
        models = {}
        results = {}
        
        for algorithm in self.config['models']['regression']['algorithms']:
            logger.info(f"Training {algorithm}...")
            
            if algorithm == 'linear_regression':
                from sklearn.linear_model import LinearRegression
                model = LinearRegression(**self.config['models']['regression']['hyperparameters']['linear_regression'])
            elif algorithm == 'random_forest':
                from sklearn.ensemble import RandomForestRegressor
                model = RandomForestRegressor(**self.config['models']['regression']['hyperparameters']['random_forest'])
            elif algorithm == 'xgboost':
                model = xgb.XGBRegressor(**self.config['models']['regression']['hyperparameters']['xgboost'])
            else:
                continue
            
            # Train model
            model.fit(X_train, y_train)
            models[algorithm] = model
            
            # Evaluate model
            y_pred = model.predict(X_test)
            mse = np.mean((y_test - y_pred) ** 2)
            rmse = np.sqrt(mse)
            mae = np.mean(np.abs(y_test - y_pred))
            r2 = model.score(X_test, y_test)
            
            results[algorithm] = {
                'mse': mse,
                'rmse': rmse,
                'mae': mae,
                'r2': r2
            }
        
        # Save best model
        best_algorithm = max(results.keys(), key=lambda k: results[k]['r2'])
        self.models['regression'] = models[best_algorithm]
        
        return {
            'models': models,
            'results': results,
            'best_model': best_algorithm,
            'feature_columns': feature_columns
        }
    
    def train_time_series_model(self, data: pd.DataFrame, target_column: str) -> Dict[str, Any]:
        """Train time series models"""
        logger.info("Training time series models...")
        
        # Prepare data
        y = data[target_column]
        
        # Split data (time series split)
        split_point = int(len(data) * 0.8)
        train_data = data[:split_point]
        test_data = data[split_point:]
        
        models = {}
        results = {}
        
        for algorithm in self.config['models']['time_series']['algorithms']:
            logger.info(f"Training {algorithm}...")
            
            if algorithm == 'arima':
                model = ARIMA(y[:split_point], order=self.config['models']['time_series']['hyperparameters']['arima']['order'])
                fitted_model = model.fit()
                models[algorithm] = fitted_model
                
                # Make predictions
                forecast = fitted_model.forecast(steps=len(test_data))
                mse = np.mean((test_data[target_column] - forecast) ** 2)
                rmse = np.sqrt(mse)
                
                results[algorithm] = {
                    'mse': mse,
                    'rmse': rmse,
                    'forecast': forecast.tolist()
                }
            
            elif algorithm == 'prophet':
                # Prepare data for Prophet
                prophet_data = pd.DataFrame({
                    'ds': data.index,
                    'y': data[target_column]
                })
                
                model = prophet.Prophet(
                    **self.config['models']['time_series']['hyperparameters']['prophet']
                )
                model.fit(prophet_data[:split_point])
                models[algorithm] = model
                
                # Make predictions
                future = model.make_future_dataframe(periods=len(test_data))
                forecast = model.predict(future)
                forecast_values = forecast['yhat'][split_point:].values
                
                mse = np.mean((test_data[target_column] - forecast_values) ** 2)
                rmse = np.sqrt(mse)
                
                results[algorithm] = {
                    'mse': mse,
                    'rmse': rmse,
                    'forecast': forecast_values.tolist()
                }
            
            elif algorithm == 'lstm':
                model = self.create_lstm_model(data.shape[1] - 1)
                
                # Prepare data for LSTM
                X_train = train_data.drop(columns=[target_column]).values
                y_train = train_data[target_column].values
                X_test = test_data.drop(columns=[target_column]).values
                y_test = test_data[target_column].values
                
                # Reshape for LSTM
                X_train = X_train.reshape((X_train.shape[0], 1, X_train.shape[1]))
                X_test = X_test.reshape((X_test.shape[0], 1, X_test.shape[1]))
                
                # Train model
                history = model.fit(
                    X_train, y_train,
                    validation_split=0.2,
                    epochs=self.config['training']['epochs'],
                    batch_size=self.config['training']['batch_size'],
                    callbacks=[
                        EarlyStopping(patience=self.config['training']['early_stopping_patience']),
                        ReduceLROnPlateau(factor=0.5, patience=5)
                    ],
                    verbose=0
                )
                
                models[algorithm] = model
                
                # Make predictions
                y_pred = model.predict(X_test)
                mse = np.mean((y_test - y_pred.flatten()) ** 2)
                rmse = np.sqrt(mse)
                
                results[algorithm] = {
                    'mse': mse,
                    'rmse': rmse,
                    'forecast': y_pred.flatten().tolist(),
                    'history': history.history
                }
        
        # Save best model
        best_algorithm = min(results.keys(), key=lambda k: results[k]['rmse'])
        self.models['time_series'] = models[best_algorithm]
        
        return {
            'models': models,
            'results': results,
            'best_model': best_algorithm
        }
    
    def create_neural_network(self, input_dim: int, output_dim: int) -> tf.keras.Model:
        """Create neural network model"""
        model = Sequential([
            Dense(self.config['models']['classification']['hyperparameters']['neural_network']['hidden_layers'][0], 
                  activation='relu', input_dim=input_dim),
            Dropout(self.config['models']['classification']['hyperparameters']['neural_network']['dropout']),
            Dense(self.config['models']['classification']['hyperparameters']['neural_network']['hidden_layers'][1], 
                  activation='relu'),
            Dropout(self.config['models']['classification']['hyperparameters']['neural_network']['dropout']),
            Dense(output_dim, activation='softmax')
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def create_lstm_model(self, input_dim: int) -> tf.keras.Model:
        """Create LSTM model for time series"""
        model = Sequential([
            LSTM(self.config['models']['time_series']['hyperparameters']['lstm']['units'], 
                 return_sequences=True, input_shape=(1, input_dim)),
            Dropout(self.config['models']['time_series']['hyperparameters']['lstm']['dropout']),
            LSTM(self.config['models']['time_series']['hyperparameters']['lstm']['units']),
            Dropout(self.config['models']['time_series']['hyperparameters']['lstm']['dropout']),
            Dense(1)
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        return model
    
    def save_models(self, model_type: str):
        """Save trained models"""
        models_dir = Path(self.config['data_paths']['models'])
        models_dir.mkdir(parents=True, exist_ok=True)
        
        # Save main model
        if model_type in self.models:
            model_path = models_dir / f"{model_type}_model.pkl"
            if hasattr(self.models[model_type], 'save'):
                # TensorFlow/Keras model
                self.models[model_type].save(models_dir / f"{model_type}_model.h5")
            else:
                # Scikit-learn model
                joblib.dump(self.models[model_type], model_path)
        
        # Save scalers and encoders
        if model_type in self.scalers:
            scaler_path = models_dir / f"{model_type}_scaler.pkl"
            joblib.dump(self.scalers[model_type], scaler_path)
        
        if model_type in self.encoders:
            encoder_path = models_dir / f"{model_type}_encoders.pkl"
            joblib.dump(self.encoders[model_type], encoder_path)
        
        if model_type in self.vectorizers:
            vectorizer_path = models_dir / f"{model_type}_vectorizer.pkl"
            joblib.dump(self.vectorizers[model_type], vectorizer_path)
        
        logger.info(f"Models saved for {model_type}")
    
    def load_models(self, model_type: str):
        """Load trained models"""
        models_dir = Path(self.config['data_paths']['models'])
        
        # Load main model
        model_path = models_dir / f"{model_type}_model.pkl"
        if model_path.exists():
            self.models[model_type] = joblib.load(model_path)
        
        # Load scalers and encoders
        scaler_path = models_dir / f"{model_type}_scaler.pkl"
        if scaler_path.exists():
            self.scalers[model_type] = joblib.load(scaler_path)
        
        encoder_path = models_dir / f"{model_type}_encoders.pkl"
        if encoder_path.exists():
            self.encoders[model_type] = joblib.load(encoder_path)
        
        vectorizer_path = models_dir / f"{model_type}_vectorizer.pkl"
        if vectorizer_path.exists():
            self.vectorizers[model_type] = joblib.load(vectorizer_path)
        
        logger.info(f"Models loaded for {model_type}")
    
    def run_training_pipeline(self, data_type: str, target_column: str, model_type: str):
        """Run complete training pipeline"""
        logger.info(f"Starting training pipeline for {data_type} - {model_type}")
        
        try:
            # Load and preprocess data
            data = self.load_training_data(data_type)
            
            # Train model based on type
            if model_type == 'classification':
                results = self.train_classification_model(data, target_column)
            elif model_type == 'regression':
                results = self.train_regression_model(data, target_column)
            elif model_type == 'time_series':
                results = self.train_time_series_model(data, target_column)
            else:
                raise ValueError(f"Unknown model type: {model_type}")
            
            # Save models
            self.save_models(model_type)
            
            # Save results
            results_path = Path(self.config['data_paths']['logs']) / f"{data_type}_{model_type}_results.json"
            results_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(results_path, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            
            logger.info(f"Training pipeline completed for {data_type} - {model_type}")
            return results
            
        except Exception as e:
            logger.error(f"Training pipeline failed: {e}")
            raise

# Example usage
if __name__ == "__main__":
    # Initialize pipeline
    pipeline = MLTrainingPipeline()
    
    # Train different models
    try:
        # Train reconciliation classification model
        reconciliation_results = pipeline.run_training_pipeline(
            data_type="reconciliation",
            target_column="match_status",
            model_type="classification"
        )
        
        # Train anomaly detection model
        anomaly_results = pipeline.run_training_pipeline(
            data_type="anomaly_detection",
            target_column="is_anomaly",
            model_type="classification"
        )
        
        # Train time series forecasting model
        timeseries_results = pipeline.run_training_pipeline(
            data_type="time_series",
            target_column="value",
            model_type="time_series"
        )
        
        print("All training pipelines completed successfully!")
        
    except Exception as e:
        print(f"Training failed: {e}")
