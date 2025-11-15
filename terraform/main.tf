# Terraform configuration for Reconciliation Platform
# Deploys to AWS (can be adapted for GCP/Azure)

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "reconciliation-platform-terraform"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "reconciliation-platform-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "reconciliation-platform-igw"
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "reconciliation-platform-public-subnet"
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "reconciliation-platform-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Security Group
resource "aws_security_group" "main" {
  name        = "reconciliation-platform-sg"
  description = "Security group for Reconciliation Platform"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 2000
    to_port     = 2000
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port      = 0
    protocol     = "-1"
    cidr_blocks  = ["0.0.0.0/0"]
  }

  tags = {
    Name = "reconciliation-platform-sg"
  }
}

# RDS PostgreSQL Database
resource "aws_db_instance" "main" {
  identifier           = "reconciliation-platform-db"
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t3.medium"
  allocated_storage    = 100
  storage_type         = "gp3"
  db_name              = "reconciliation_app"
  username             = var.db_username
  password             = var.db_password
  vpc_security_group_ids = [aws_security_group.main.id]
  db_subnet_group_name = aws_db_subnet_group.main.name
  skip_final_snapshot  = true
  publicly_accessible  = false

  tags = {
    Name = "reconciliation-platform-db"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "reconciliation-platform-db-subnet"
  subnet_ids = [aws_subnet.public.id]

  tags = {
    Name = "reconciliation-platform-db-subnet"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "main" {
  cluster_id           = "reconciliation-platform-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.main.id]
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "reconciliation-platform-redis-subnet"
  subnet_ids = [aws_subnet.public.id]
}

# Outputs
output "vpc_id" {
  value = aws_vpc.main.id
}

output "database_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.main.cache_nodes[0].address
}

